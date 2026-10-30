import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

function loadEnv() {
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
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const sql = neon(process.env.DATABASE_URL!);

async function check() {
  const users = await sql`
    SELECT id, email, full_name, role, email_verified, created_at, updated_at
    FROM users
    ORDER BY updated_at DESC LIMIT 10;
  `;
  console.log('Recent Users:');
  console.table(users);

  const otps = await sql`
    SELECT o.id, u.email, o.purpose, o.expires_at, o.consumed, o.attempts, o.created_at
    FROM otp_codes o
    JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC LIMIT 10;
  `;
  console.log('Recent OTPs:');
  console.table(otps);
  process.exit(0);
}

check().catch(console.error);
