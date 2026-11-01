import { rateLimit } from '@/lib/rateLimit';
import { AppError } from '@/lib/errors';
import type { AiFeatureName, AiProvider } from './types';

const FEATURE_LIMITS: Record<AiFeatureName, number> = {
  template_recommend: 10,
  improve_summary: 15,
  improve_bullets: 20,
  improve_skills: 15,
  suggest_strengths: 15,
  job_match: 15,
  bullet_library: 25,
  ats_check: 5,
  template_search: 30,
};

const ONE_HOUR_MS = 60 * 60 * 1000;

export class AiRateLimitError extends AppError {
  public readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super(
      429,
      'AI_RATE_LIMITED',
      `Rate limit exceeded for this AI feature. Please retry after ${retryAfterSeconds} seconds.`
    );
    this.retryAfterSeconds = retryAfterSeconds;
    this.name = 'AiRateLimitError';
  }
}

// -------------------------------------------------------------
// Provider Cooldown Tracking (Module-level memory)
// -------------------------------------------------------------
const providerCooldowns: Record<AiProvider, number> = {
  gemini: 0,
  groq: 0,
  huggingface: 0,
};

/**
 * Marks a provider as cooling down for a specified duration (default 30 seconds).
 */
export function markProviderCooldown(provider: AiProvider, durationMs = 30000): void {
  providerCooldowns[provider] = Date.now() + durationMs;
}

/**
 * Checks whether a provider is currently in cooldown.
 */
export function isProviderCoolingDown(provider: AiProvider): boolean {
  const until = providerCooldowns[provider] || 0;
  return Date.now() < until;
}

/**
 * Returns remaining cooldown milliseconds for a provider, or 0 if active.
 */
export function getProviderCooldownRemainingMs(provider: AiProvider): number {
  const until = providerCooldowns[provider] || 0;
  return Math.max(0, until - Date.now());
}

/**
 * Resets cooldown timers for one or all providers.
 */
export function resetProviderCooldown(provider?: AiProvider): void {
  if (provider) {
    providerCooldowns[provider] = 0;
  } else {
    providerCooldowns.gemini = 0;
    providerCooldowns.groq = 0;
    providerCooldowns.huggingface = 0;
  }
}

// -------------------------------------------------------------
// Active Request Context Tracking
// -------------------------------------------------------------
export interface AiContextState {
  userId?: string;
  feature?: AiFeatureName;
  lastProvider?: AiProvider;
  lastModel?: string;
  lastErrorCode?: string;
  loggedFailureForRequest?: boolean;
  loggedSuccessForRequest?: boolean;
}

let activeContext: AiContextState = {};

export function setLastActiveAiContext(state: Partial<AiContextState>): void {
  activeContext = { ...activeContext, ...state };
}

export function getLastActiveAiContext(): AiContextState {
  return activeContext;
}

export function resetActiveAiContext(): void {
  activeContext = {};
}

/**
 * Enforces per-feature sliding-window rate limits for authenticated users.
 * Throws AiRateLimitError (HTTP 429) if the limit is exceeded.
 */
export function enforceAiRateLimit(userId: string, feature: AiFeatureName): void {
  setLastActiveAiContext({
    userId,
    feature,
    loggedFailureForRequest: false,
    loggedSuccessForRequest: false,
  });

  const limit = FEATURE_LIMITS[feature] ?? 10;
  const key = `ai:${feature}:${userId}`;

  const result = rateLimit(key, limit, ONE_HOUR_MS);

  if (!result.allowed) {
    const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    throw new AiRateLimitError(retryAfterSeconds);
  }
}
