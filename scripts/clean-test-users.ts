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

async function cleanup() {
  const emails = ['ajadeel229@gmail.com', 'tmailing461@gmail.com', 'davidbenjamin8990@gmail.com'];
  for (const email of emails) {
    const res = await sql`DELETE FROM users WHERE email = ${email};`;
    console.log(`Deleted test user: ${email}`);
  }
  process.exit(0);
}

cleanup().catch(console.error);
