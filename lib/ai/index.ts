import { z } from 'zod';
import { AppError } from '@/lib/errors';
import { env } from '@/lib/env';
import {
  AiChatMessage,
  AiCompletionOptions,
  AiCompletionResult,
  AiProvider,
  AiProviderUnavailable,
} from './types';
import { completeGemini } from './providers/gemini';
import { completeGroq } from './providers/groq';
import { completeHuggingFace } from './providers/huggingface';
import {
  classifyAiError,
  getDefaultModel,
  logAiUsage,
} from './log';
import {
  getLastActiveAiContext,
  isProviderCoolingDown,
  markProviderCooldown,
  setLastActiveAiContext,
} from './rate-limit';

export * from './types';
export * from './log';
export * from './rate-limit';

export interface ProviderHandler {
  name: AiProvider;
  run: (messages: AiChatMessage[], opts?: AiCompletionOptions) => Promise<AiCompletionResult>;
}

/**
 * Registry of provider completion functions.
 * Exposed to permit mocking/monkey-patching during tests.
 */
export const PROVIDER_RUNNERS: Record<
  AiProvider,
  (messages: AiChatMessage[], opts?: AiCompletionOptions) => Promise<AiCompletionResult>
> = {
  groq: completeGroq,
  gemini: completeGemini,
  huggingface: completeHuggingFace,
};

const PROVIDER_ORDER: AiProvider[] = ['groq', 'gemini', 'huggingface'];
const BACKOFF_DELAYS_MS = [100, 500, 1500];

/**
 * Executes an AI chat completion across the provider fallback chain (Gemini -> Groq -> HuggingFace).
 * - Each provider is attempted ONCE per aiComplete call.
 * - Backpressure/cooldown applied when a provider is rate limited.
 * - Exponential backoff (100ms -> 500ms -> 1500ms) applied ONLY between providers.
 * - Failures logged with exact provider, model, and classified error code.
 */
export async function aiComplete(
  messages: AiChatMessage[],
  opts: AiCompletionOptions = {}
): Promise<AiCompletionResult> {
  const startTime = Date.now();
  const totalBudgetMs = 60000;

  const context = getLastActiveAiContext();
  const userId = opts.userId || context.userId;
  const feature = opts.feature || context.feature || 'improve_bullets';

  const errors: { provider: string; model: string; errorCode: string; reason: string }[] = [];

  for (let i = 0; i < PROVIDER_ORDER.length; i++) {
    const providerName = PROVIDER_ORDER[i];

    // Check overall time budget
    const elapsed = Date.now() - startTime;
    if (elapsed >= totalBudgetMs) {
      break;
    }

    // Check backpressure: skip cooling down providers without network request
    if (isProviderCoolingDown(providerName)) {
      console.log(`[AI Fallback] Skipping ${providerName} (cooling down)`);
      continue;
    }

    // Skip HuggingFace silently if key not configured
    if (providerName === 'huggingface' && (!env.HUGGINGFACE_API_KEY || !env.HUGGINGFACE_API_KEY.trim())) {
      continue;
    }

    const providerStartTime = Date.now();
    const modelName = opts.model || getDefaultModel(providerName);

    try {
      setLastActiveAiContext({
        lastProvider: providerName,
        lastModel: modelName,
      });

      const remainingTime = Math.min(totalBudgetMs - elapsed, opts.timeoutMs ?? 25000);
      const runner = PROVIDER_RUNNERS[providerName];

      const result = await runner(messages, {
        ...opts,
        timeoutMs: remainingTime,
      });

      logAiUsage(
        userId,
        feature,
        result.provider,
        result.model,
        true,
        result.tokensUsed,
        null,
        Date.now() - providerStartTime
      );

      return result;
    } catch (err: any) {
      const providerDurationMs = Date.now() - providerStartTime;
      const errorCode = err?.code && err.code !== 'UNKNOWN' ? err.code : classifyAiError(err);
      const reason = err?.message || 'Unknown provider error';

      console.warn(`[AI Fallback] Provider ${providerName} (${modelName}) failed with [${errorCode}]: ${reason}`);

      // Mark provider in cooldown if rate limited
      if (errorCode === 'RATE_LIMIT') {
        markProviderCooldown(providerName, 30000);
      }

      // Log failure with exact provider, model, and error code
      logAiUsage(
        userId,
        feature,
        providerName,
        modelName,
        false,
        null,
        errorCode,
        providerDurationMs
      );

      errors.push({
        provider: providerName,
        model: modelName,
        errorCode,
        reason,
      });

      // Apply exponential backoff between providers (not within a provider)
      const isLastProvider = i === PROVIDER_ORDER.length - 1;
      if (!isLastProvider) {
        const delay = BACKOFF_DELAYS_MS[i] ?? 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error('[AI Fallback] All providers exhausted:', errors);
  throw new AppError(503, 'AI_PROVIDERS_EXHAUSTED', 'AI service temporarily unavailable');
}

/**
 * Strips markdown code block wrappers (e.g. ```json ... ```) or surrounding text from model outputs.
 */
function extractRawJson(text: string): string {
  let cleaned = text.trim();
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = cleaned.match(jsonBlockRegex);
  if (match) {
    return match[1].trim();
  }

  // If no code block, find outermost { ... } or [ ... ]
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx !== -1) {
    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    const endIdx = Math.max(lastBrace, lastBracket);
    if (endIdx > startIdx) {
      return cleaned.slice(startIdx, endIdx + 1).trim();
    }
  }

  return cleaned;
}

/**
 * Completes and validates structured JSON output with automatic retry.
 * Only retries on the SAME provider that answered first.
 */
export async function aiCompleteJson<T>(
  messages: AiChatMessage[],
  opts: AiCompletionOptions = {},
  schema?: z.ZodType<T>
): Promise<{ data: T; provider: AiProvider; model: string; tokensUsed?: number }> {
  const jsonOpts: AiCompletionOptions = {
    ...opts,
    jsonMode: true,
    maxTokens: opts.maxTokens ?? 2048,
  };

  let firstAttemptResult: AiCompletionResult | null = null;

  try {
    firstAttemptResult = await aiComplete(messages, jsonOpts);
    const cleaned = extractRawJson(firstAttemptResult.text);
    const parsed = JSON.parse(cleaned);
    const validated = schema ? schema.parse(parsed) : (parsed as T);
    return {
      data: validated,
      provider: firstAttemptResult.provider,
      model: firstAttemptResult.model,
      tokensUsed: firstAttemptResult.tokensUsed,
    };
  } catch (err: any) {
    // If all providers failed or service unavailable, rethrow directly
    if (err instanceof AppError && err.statusCode === 503) {
      throw err;
    }
    // If first attempt didn't even complete from any provider, rethrow
    if (!firstAttemptResult) {
      throw err;
    }
    console.warn(
      `[AI JSON] First attempt failed parse/validation from ${firstAttemptResult.provider}. Retrying on SAME provider only:`,
      err?.message
    );
  }

  // Retry once with stricter prompt instruction ONLY on the SAME provider that answered
  try {
    const retryMessages: AiChatMessage[] = [
      ...messages,
      {
        role: 'user',
        content:
          'CRITICAL: Your previous response was not valid JSON or did not match the expected schema. Respond ONLY with raw, valid JSON. Do not include markdown code blocks, conversational prefixes, or trailing notes.',
      },
    ];

    const providerRunner = PROVIDER_RUNNERS[firstAttemptResult.provider];
    const retryResult = await providerRunner(retryMessages, {
      ...jsonOpts,
      model: firstAttemptResult.model,
    });

    const cleaned = extractRawJson(retryResult.text);
    const parsed = JSON.parse(cleaned);
    const validated = schema ? schema.parse(parsed) : (parsed as T);

    return {
      data: validated,
      provider: retryResult.provider,
      model: retryResult.model,
      tokensUsed: (firstAttemptResult?.tokensUsed ?? 0) + (retryResult.tokensUsed ?? 0),
    };
  } catch (secondErr: any) {
    console.error('[AI JSON] Retry attempt on same provider also failed:', secondErr?.message || secondErr);
    throw new AppError(502, 'AI_INVALID_RESPONSE', 'Failed to generate a valid structured response from AI');
  }
}
