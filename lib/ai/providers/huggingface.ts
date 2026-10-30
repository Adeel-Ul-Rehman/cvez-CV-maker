import { HfInference } from '@huggingface/inference';
import { env } from '@/lib/env';
import {
  AiChatMessage,
  AiCompletionOptions,
  AiCompletionResult,
  AiProviderError,
  AiProviderUnavailable,
} from '../types';
import { classifyAiError } from '../log';

export const HUGGINGFACE_MODEL = 'mistralai/Mistral-7B-Instruct-v0.3';

export async function completeHuggingFace(
  messages: AiChatMessage[],
  opts: AiCompletionOptions = {}
): Promise<AiCompletionResult> {
  const apiKey = env.HUGGINGFACE_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new AiProviderUnavailable('huggingface', 'HUGGINGFACE_API_KEY is not configured');
  }

  const timeoutMs = opts.timeoutMs ?? 25000;
  const modelName = opts.model || HUGGINGFACE_MODEL;

  try {
    const hf = new HfInference(apiKey);

    const formattedMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];

    const systemPrompt = opts.systemPrompt;
    const hasSystemMessage = messages.some((m) => m.role === 'system');

    if (systemPrompt && !hasSystemMessage) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }

    for (const m of messages) {
      formattedMessages.push({
        role: m.role,
        content: m.content,
      });
    }

    const apiPromise = hf.chatCompletion({
      model: modelName,
      messages: formattedMessages,
      max_tokens: opts.maxTokens ?? 2048,
      temperature: opts.temperature ?? 0.4,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`HuggingFace completion timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    const res = await Promise.race([apiPromise, timeoutPromise]);
    const text = res.choices[0]?.message?.content || '';
    const tokensUsed = res.usage?.total_tokens;

    return {
      text,
      provider: 'huggingface',
      model: modelName,
      tokensUsed,
    };
  } catch (err: any) {
    if (err instanceof AiProviderUnavailable) throw err;
    const code = classifyAiError(err);
    throw new AiProviderError('huggingface', err?.message || 'HuggingFace completion failed', err, code);
  }
}
