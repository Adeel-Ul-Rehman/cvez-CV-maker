import Groq from 'groq-sdk';
import { env } from '@/lib/env';
import {
  AiChatMessage,
  AiCompletionOptions,
  AiCompletionResult,
  AiProviderError,
  AiProviderUnavailable,
} from '../types';
import { classifyAiError } from '../log';

export const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

export async function completeGroq(
  messages: AiChatMessage[],
  opts: AiCompletionOptions = {}
): Promise<AiCompletionResult> {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new AiProviderUnavailable('groq', 'GROQ_API_KEY is not configured');
  }

  const timeoutMs = opts.timeoutMs ?? 20000;
  const modelsToTry = opts.model ? [opts.model] : GROQ_MODELS;

  const groq = new Groq({ apiKey });

  const formattedMessages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [];

  const systemPrompt = opts.systemPrompt;
  const hasSystemMessage = messages.some((m) => m.role === 'system');

  if (systemPrompt && !hasSystemMessage) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }

  for (const m of messages) {
    formattedMessages.push({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    });
  }

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const apiPromise = groq.chat.completions.create({
        model: modelName,
        messages: formattedMessages,
        max_tokens: opts.maxTokens ?? 2048,
        temperature: opts.temperature ?? 0.4,
        response_format: opts.jsonMode ? { type: 'json_object' } : undefined,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Groq completion timed out after ${timeoutMs}ms`)), timeoutMs)
      );

      const completion = await Promise.race([apiPromise, timeoutPromise]);
      const choice = completion.choices[0];
      const text = choice?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens;

      return {
        text,
        provider: 'groq',
        model: modelName,
        tokensUsed,
      };
    } catch (err: any) {
      lastError = err;
      const errorCode = classifyAiError(err);

      // If one model returns RATE_LIMIT or AUTH, do NOT retry another model of the same provider
      if (errorCode === 'RATE_LIMIT' || errorCode === 'AUTH') {
        throw new AiProviderError('groq', err?.message || 'Groq failure', err, errorCode);
      }

      console.warn(`[Groq Model Fallback] Model ${modelName} failed (${errorCode}): ${err?.message}. Trying next model...`);
    }
  }

  const finalCode = classifyAiError(lastError);
  throw new AiProviderError('groq', lastError?.message || 'All Groq models failed', lastError, finalCode);
}
