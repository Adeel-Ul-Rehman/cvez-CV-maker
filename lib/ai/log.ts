import crypto from 'crypto';
import { sql } from '@/lib/db';
import type { AiFeatureName, AiProvider } from './types';
import { getLastActiveAiContext, setLastActiveAiContext } from './rate-limit';

export function getDefaultModel(provider: AiProvider | string): string {
  switch (provider) {
    case 'gemini':
      return 'gemini-2.5-flash';
    case 'groq':
      return 'openai/gpt-oss-120b';
    case 'huggingface':
      return 'mistralai/Mistral-7B-Instruct-v0.3';
    default:
      return 'gemini-2.5-flash';
  }
}

/**
 * Classifies any thrown error into a standardized error code:
 * "RATE_LIMIT" | "AUTH" | "TIMEOUT" | "INVALID_JSON" | "NETWORK" | "UNKNOWN"
 */
export function classifyAiError(err: any): string {
  if (!err) return 'UNKNOWN';

  const rawCode = err.code || err.status || err.statusCode;
  const msg = (err.message || String(err)).toLowerCase();
  const causeMsg = (err.cause?.message || String(err.cause || '')).toLowerCase();
  const combined = `${msg} ${causeMsg}`;

  if (
    rawCode === 'RATE_LIMIT' ||
    rawCode === 429 ||
    combined.includes('quota') ||
    combined.includes('rate limit') ||
    combined.includes('too many requests') ||
    combined.includes('resource_exhausted') ||
    combined.includes('requests per minute')
  ) {
    return 'RATE_LIMIT';
  }

  if (
    rawCode === 'AUTH' ||
    rawCode === 401 ||
    rawCode === 403 ||
    combined.includes('api key') ||
    combined.includes('unauthorized') ||
    combined.includes('forbidden') ||
    combined.includes('authentication') ||
    combined.includes('not configured') ||
    combined.includes('permission_denied')
  ) {
    return 'AUTH';
  }

  if (
    rawCode === 'TIMEOUT' ||
    rawCode === 'ETIMEDOUT' ||
    rawCode === 408 ||
    combined.includes('timeout') ||
    combined.includes('timed out') ||
    combined.includes('abort')
  ) {
    return 'TIMEOUT';
  }

  if (
    rawCode === 'INVALID_JSON' ||
    combined.includes('json') ||
    combined.includes('parse') ||
    combined.includes('unterminated string') ||
    combined.includes('ai_invalid_response')
  ) {
    return 'INVALID_JSON';
  }

  if (
    rawCode === 'ECONNRESET' ||
    rawCode === 'ENOTFOUND' ||
    rawCode === 'ECONNREFUSED' ||
    combined.includes('network') ||
    combined.includes('fetch failed')
  ) {
    return 'NETWORK';
  }

  if (typeof rawCode === 'string' && rawCode.length > 0 && rawCode !== 'ERROR' && rawCode !== 'unknown') {
    return rawCode;
  }

  // Never return literal "unknown" — use specific deterministic hash if truly unclassified
  const hash = crypto.createHash('md5').update(combined.trim() || 'unknown').digest('hex').slice(0, 6);
  return `UNKNOWN_${hash}`;
}

/**
 * Fire-and-forget logging of AI completion usage.
 * Errors during logging are caught and printed to console without blocking or failing the API request.
 * Guaranteed never to log "unknown" for provider or model.
 */
export function logAiUsage(
  userId: string | null | undefined,
  feature: AiFeatureName,
  provider: AiProvider | string,
  model: string,
  success: boolean,
  tokensUsed: number | null | undefined,
  errorCode: string | null | undefined,
  durationMs: number
): void {
  const context = getLastActiveAiContext();

  // If this failure was already logged by aiComplete for this request context, avoid duplicate insert
  if (!success && provider === 'unknown' && context.loggedFailureForRequest) {
    return;
  }

  // If this success was already logged for this request context, avoid duplicate insert
  if (success && context.loggedSuccessForRequest) {
    return;
  }

  // Resolve provider: NEVER allow literal "unknown"
  let cleanProvider = provider;
  if (!cleanProvider || cleanProvider === 'unknown') {
    cleanProvider = context.lastProvider || 'gemini';
  }

  // Resolve model: NEVER allow literal "unknown"
  let cleanModel = model;
  if (!cleanModel || cleanModel === 'unknown') {
    cleanModel = context.lastModel || getDefaultModel(cleanProvider);
  }

  // Resolve error code: NEVER allow literal "unknown"
  let cleanErrorCode = errorCode;
  if (!success) {
    if (!cleanErrorCode || cleanErrorCode === 'ERROR' || cleanErrorCode === 'unknown') {
      cleanErrorCode = context.lastErrorCode || 'UNKNOWN';
    }
  } else {
    cleanErrorCode = null;
  }

  const cleanUserId = userId || context.userId || null;

  if (!success) {
    setLastActiveAiContext({
      lastProvider: cleanProvider as AiProvider,
      lastModel: cleanModel,
      lastErrorCode: cleanErrorCode || undefined,
      loggedFailureForRequest: true,
    });
  } else {
    setLastActiveAiContext({
      lastProvider: cleanProvider as AiProvider,
      lastModel: cleanModel,
      loggedSuccessForRequest: true,
    });
  }

  sql`
    INSERT INTO ai_usage_logs (
      user_id,
      feature,
      provider,
      model,
      tokens_used,
      success,
      error_code,
      duration_ms
    ) VALUES (
      ${cleanUserId},
      ${feature},
      ${cleanProvider},
      ${cleanModel},
      ${tokensUsed ?? null},
      ${success},
      ${cleanErrorCode ?? null},
      ${Math.round(durationMs)}
    );
  `.catch((err) => {
    console.error('Failed to write to ai_usage_logs:', err?.message || err);
  });
}
