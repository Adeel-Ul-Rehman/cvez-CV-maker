export type AiProvider = 'gemini' | 'groq' | 'huggingface';

export type AiCompletionResult = {
  text: string;
  provider: AiProvider;
  model: string;
  tokensUsed?: number;
};

export type AiChatMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string };

export type AiFeatureName =
  | 'template_recommend'
  | 'improve_summary'
  | 'improve_bullets'
  | 'improve_skills'
  | 'suggest_strengths'
  | 'job_match'
  | 'bullet_library'
  | 'ats_check'
  | 'template_search';

export type AiErrorCode =
  | 'RATE_LIMIT'
  | 'AUTH'
  | 'TIMEOUT'
  | 'INVALID_JSON'
  | 'NETWORK'
  | 'UNKNOWN'
  | string;

export type AiCompletionOptions = {
  maxTokens?: number; // default 2048
  temperature?: number; // default 0.4
  systemPrompt?: string;
  jsonMode?: boolean; // request structured JSON output
  timeoutMs?: number; // per-call timeout
  userId?: string;
  feature?: AiFeatureName;
  model?: string; // override specific model
};

export class AiProviderError extends Error {
  public code: string;

  constructor(
    public provider: AiProvider,
    message: string,
    public cause?: any,
    code?: string
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'AiProviderError';
    this.code = code || 'UNKNOWN';
  }
}

export class AiProviderUnavailable extends Error {
  public code: string;

  constructor(public provider: AiProvider, message: string) {
    super(`[${provider}] ${message}`);
    this.name = 'AiProviderUnavailable';
    this.code = 'AUTH';
  }
}
