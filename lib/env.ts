import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// Sync .env file values into process.env dynamically
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx !== -1) {
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (val !== undefined && val !== '') {
          process.env[key] = val;
        }
      }
    }
  }
} catch {
  // Ignore error if fs is inaccessible
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Admin credentials
  ADMIN_EMAIL: z.string().email().default('admin@cvmaker.local'),
  ADMIN_PASSWORD: z.string().min(8).default('X7#mP9$qK2!vL5*w'),

  // Auth & Tokens
  JWT_SECRET: z.string().min(16).default('cv_maker_super_secure_jwt_secret_2026_xyz'),
  JWT_REFRESH_SECRET: z.string().min(16).default('cv_maker_super_secure_refresh_secret_2026_xyz'),
  OTP_EXPIRY_MINUTES: z.coerce.number().positive().default(10),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().positive().default(7),
  BCRYPT_ROUNDS: z.coerce.number().min(4).max(14).default(10),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z
    .preprocess(
      (val) => val === 'true' || val === true || (process.env.NODE_ENV === 'production' && val !== 'false'),
      z.boolean()
    )
    .default(false),

  // Mailer
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('noreply@cvmaker.local'),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  // AI & External APIs
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Puppeteer / Chromium
  PUPPETEER_EXECUTABLE_PATH: z.string().optional(),

  // App URL
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse({
  ...process.env,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GEMINI_API,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  console.error('Environment validation failed:');
  for (const issue of issues) {
    console.error(`  - ${issue}`);
  }
  throw new Error(`Invalid environment variables: ${issues.join('; ')}`);
}

export const env = new Proxy(parsed.data, {
  get(target, prop: string) {
    if (prop === 'GEMINI_API_KEY') {
      return process.env.GEMINI_API_KEY || process.env.GEMINI_API || target.GEMINI_API_KEY;
    }
    if (prop in target) {
      return (target as any)[prop];
    }
    return process.env[prop];
  },
});
