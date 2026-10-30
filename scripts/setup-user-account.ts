import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
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

async function setup() {
  console.log('--- Setting up user account ---');

  // 1. Delete all other users - keep only ajadeel229@gmail.com
  console.log('Cleaning up all other users from database...');
  await sql`DELETE FROM users WHERE email != 'ajadeel229@gmail.com';`;

  // 2. Prepare user account credentials
  const targetEmail = 'ajadeel229@gmail.com';
  const targetPassword = 'Password123!';
  const fullName = 'Adeel';
  const passwordHash = await bcrypt.hash(targetPassword, 10);

  // 3. Upsert user account
  const upsertRes = await sql`
    INSERT INTO users (
      email,
      password_hash,
      full_name,
      role,
      email_verified,
      provider,
      updated_at
    )
    VALUES (
      ${targetEmail},
      ${passwordHash},
      ${fullName},
      'admin',
      TRUE,
      'email',
      now()
    )
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      full_name = EXCLUDED.full_name,
      role = 'admin',
      email_verified = TRUE,
      updated_at = now()
    RETURNING id, email, full_name, role, email_verified;
  `;

  console.log('User created/synced in DB:');
  console.table(upsertRes);

  // 4. Test Login via API
  console.log('Testing login via /api/auth/login...');
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: targetEmail,
      password: targetPassword,
    }),
  });

  const loginJson = await loginRes.json();
  console.log('Login status:', loginRes.status);
  console.log('Login response:', loginJson);

  if (loginRes.ok && loginJson.ok) {
    console.log('\n============================================================');
    console.log('ACCOUNT READY FOR IMMEDIATE LOGIN:');
    console.log('  Email:    ', targetEmail);
    console.log('  Password: ', targetPassword);
    console.log('  Role:      admin (Access to /dashboard AND /admin/dashboard)');
    console.log('  Status:    Verified (No OTP needed)');
    console.log('============================================================\n');
  } else {
    throw new Error('Login test failed');
  }

  process.exit(0);
}

setup().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
