import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { TEMPLATES } from '../templates/registry';

// Zero-dependency .env loader for standalone script execution
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
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL is not set in environment or .env');
  process.exit(1);
}

const adminEmail = process.env.ADMIN_EMAIL || 'admin@cvmaker.local';
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword) {
  console.error('ERROR: ADMIN_PASSWORD is not set in environment or .env');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function runSeed() {
  console.log('============================================================');
  console.log('STARTING DATABASE SEEDING');
  console.log('============================================================\n');

  // 1. Seed Templates
  console.log(`Seeding ${TEMPLATES.length} templates from TEMPLATES registry...`);
  const activeKeys = TEMPLATES.map((t) => t.key);

  // Deactivate any templates not in active registry
  try {
    for (const key of activeKeys) {
      // Keep active
    }
    await sql`UPDATE templates SET is_active = FALSE WHERE NOT (template_key = ANY(${activeKeys}));`;
  } catch (e) {
    console.warn('Notice: Could not bulk deactivate old templates:', e);
  }

  let templatesUpserted = 0;

  for (let i = 0; i < TEMPLATES.length; i++) {
    const t = TEMPLATES[i];
    const thumbUrl = `/template-thumbnails/${t.key}.png`;
    await sql`
      INSERT INTO templates (
        template_key,
        name,
        description,
        category,
        thumbnail_url,
        definition,
        is_active,
        display_order
      )
      VALUES (
        ${t.key},
        ${t.name},
        ${t.description},
        ${t.category},
        ${thumbUrl},
        ${JSON.stringify(t)}::jsonb,
        TRUE,
        ${i}
      )
      ON CONFLICT (template_key) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        thumbnail_url = EXCLUDED.thumbnail_url,
        definition = EXCLUDED.definition,
        is_active = EXCLUDED.is_active,
        display_order = EXCLUDED.display_order,
        updated_at = now();
    `;
    templatesUpserted++;
    console.log(`  ✓ Upserted template: [${t.key}] "${t.name}" (${t.category})`);
  }

  // 2. Seed Admin User
  console.log(`\nSeeding admin user (${adminEmail})...`);
  const passwordToHash = adminPassword || 'X7#mP9$qK2!vL5*w';
  const passwordHash = await bcrypt.hash(passwordToHash, 10);

  const insertResult = await sql`
    INSERT INTO users (
      email,
      password_hash,
      full_name,
      role,
      email_verified,
      provider
    )
    VALUES (
      ${adminEmail},
      ${passwordHash},
      'System Administrator',
      'admin',
      TRUE,
      'email'
    )
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      role = 'admin',
      email_verified = TRUE,
      updated_at = now()
    RETURNING id, email, role, email_verified;
  `;

  if (insertResult && insertResult.length > 0) {
    console.log(`  ✓ Admin user created/synced successfully (ID: ${insertResult[0].id})`);
  }

  // Print Summary
  console.log('\n============================================================');
  console.log('SEED SUMMARY:');
  console.log(`  - Templates upserted: ${templatesUpserted}`);
  console.log(`  - Admin user email:   ${adminEmail}`);
  console.log(`  - Status:             COMPLETE`);
  console.log('============================================================\n');
}

runSeed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
