import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';

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

const sql = neon(databaseUrl);

function parseSqlStatements(sqlContent: string): string[] {
  const statements: string[] = [];
  let currentStmt = '';

  for (const rawLine of sqlContent.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('--')) continue;

    currentStmt += ' ' + line;
    if (line.endsWith(';')) {
      statements.push(currentStmt.trim());
      currentStmt = '';
    }
  }

  if (currentStmt.trim()) {
    statements.push(currentStmt.trim());
  }

  return statements;
}

async function executeSqlFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const statements = parseSqlStatements(content);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt || stmt.startsWith('--')) continue;

    try {
      await sql(stmt);
      const firstLine = stmt.split('\n')[0].slice(0, 60);
      console.log(`    ✓ ${firstLine}...`);
    } catch (stmtErr: any) {
      console.error(`\nFAILED statement #${i + 1} in ${path.basename(filePath)}:\n${stmt}`);
      console.error('ERROR message:', stmtErr.message || stmtErr);
      throw stmtErr;
    }
  }
}

async function runMigration() {
  const isReset = process.argv.includes('--reset');
  const isConfirmed =
    process.env.CONFIRM_RESET === 'yes' ||
    process.argv.includes('--confirm') ||
    process.argv.includes('CONFIRM_RESET=yes');

  if (isReset) {
    if (!isConfirmed) {
      console.error(
        'ERROR: --reset requires CONFIRM_RESET=yes environment variable to execute.'
      );
      process.exit(1);
    }

    console.log('RESETTING DATABASE: Dropping all known tables and migrations...');
    try {
      await sql`
        DROP TABLE IF EXISTS schema_migrations, cv_versions, cvs, otp_codes, refresh_tokens, templates, users, categories CASCADE;
      `;
      console.log('✓ All known tables and schema_migrations dropped successfully.\n');
    } catch (dropErr) {
      console.error('ERROR dropping tables:', dropErr);
      process.exit(1);
    }
  }

  // 1. Enable pgcrypto
  try {
    console.log('Enabling pgcrypto extension...');
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;
    console.log('✓ pgcrypto extension enabled.\n');
  } catch (extErr) {
    console.error('Warning/Error enabling pgcrypto:', extErr);
  }

  // 2. Ensure schema_migrations table exists
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  // 3. Check schema.sql
  const appliedRows = await sql`SELECT name FROM schema_migrations;`;
  const appliedSet = new Set(appliedRows.map((r: any) => r.name));

  const schemaPath = path.resolve(process.cwd(), 'db', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    if (!appliedSet.has('schema.sql')) {
      console.log('Applying /db/schema.sql...');
      await executeSqlFile(schemaPath);
      await sql`INSERT INTO schema_migrations (name) VALUES ('schema.sql');`;
      console.log('✓ /db/schema.sql applied and recorded in schema_migrations.\n');
    } else {
      console.log('• /db/schema.sql already applied, skipping.\n');
    }
  }

  // 4. Run migration files in /db/migrations/ sorted by filename
  const migrationsDir = path.resolve(process.cwd(), 'db', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (!appliedSet.has(file)) {
        console.log(`Applying migration /db/migrations/${file}...`);
        const filePath = path.join(migrationsDir, file);
        await executeSqlFile(filePath);
        await sql`INSERT INTO schema_migrations (name) VALUES (${file});`;
        console.log(`✓ /db/migrations/${file} applied and recorded.\n`);
      } else {
        console.log(`• /db/migrations/${file} already applied, skipping.\n`);
      }
    }
  }

  console.log(`============================================================`);
  console.log(`MIGRATIONS UP TO DATE.`);
  console.log(`============================================================\n`);
}

runMigration().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
