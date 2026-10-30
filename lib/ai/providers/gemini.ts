import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@/lib/env';
import {
  AiChatMessage,
  AiCompletionOptions,
  AiCompletionResult,
  AiProviderError,
  AiProviderUnavailable,
} from '../types';
import { classifyAiError } from '../log';

export const GEMINI_MODELS = [
  'gemini-2.5-flash',
];

export async function completeGemini(
  messages: AiChatMessage[],
  opts: AiCompletionOptions = {}
): Promise<AiCompletionResult> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new AiProviderUnavailable('gemini', 'GEMINI_API_KEY is not configured');
  }

  const timeoutMs = opts.timeoutMs ?? 20000;
  const modelsToTry = opts.model ? [opts.model] : GEMINI_MODELS;

  const genAI = new GoogleGenerativeAI(apiKey);

  // Extract system prompt from options or system message
  const systemMessage = messages.find((m) => m.role === 'system');
  const systemInstruction = opts.systemPrompt || systemMessage?.content;

  // Filter chat history (excluding system message)
  const chatMessages = messages.filter((m) => m.role !== 'system');
  const contents = chatMessages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          maxOutputTokens: opts.maxTokens ?? 2048,
          temperature: opts.temperature ?? 0.4,
          responseMimeType: opts.jsonMode ? 'application/json' : 'text/plain',
        },
      });

      const apiPromise =
        contents.length === 1
          ? model.generateContent(contents[0].parts[0].text)
          : model.generateContent({ contents });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini completion timed out after ${timeoutMs}ms`)), timeoutMs)
      );

      const response = await Promise.race([apiPromise, timeoutPromise]);
      const text = response.response.text();
      const usage = response.response.usageMetadata;

      return {
        text,
        provider: 'gemini',
        model: modelName,
        tokensUsed: usage ? usage.totalTokenCount : undefined,
      };
    } catch (err: any) {
      lastError = err;
      const errorCode = classifyAiError(err);

      // If one model returns RATE_LIMIT or AUTH, do NOT retry another model of the same provider
      if (errorCode === 'RATE_LIMIT' || errorCode === 'AUTH') {
        throw new AiProviderError('gemini', err?.message || 'Gemini failure', err, errorCode);
      }

      console.warn(`[Gemini Model Fallback] Model ${modelName} failed (${errorCode}): ${err?.message}. Trying next model...`);
    }
  }

  const finalCode = classifyAiError(lastError);
  throw new AiProviderError('gemini', lastError?.message || 'All Gemini models failed', lastError, finalCode);
}
