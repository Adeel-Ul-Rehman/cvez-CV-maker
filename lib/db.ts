import { neon, Pool } from '@neondatabase/serverless';
import { env } from './env';

const DEFAULT_FALLBACK_URL = 'postgresql://postgres:postgres@localhost:5432/neondb';
const connectionString = env.DATABASE_URL || DEFAULT_FALLBACK_URL;

/**
 * Neon serverless SQL tagged template (HTTP-based).
 * Example: await sql`SELECT * FROM users WHERE email = ${email}`;
 */
const rawSql = neon(connectionString, {
  fetchOptions: {
    cache: 'no-store',
  },
});

export const sql = new Proxy(rawSql, {
  apply(target, thisArg, argArray) {
    if (
      process.env.NODE_ENV === 'production' &&
      (!env.DATABASE_URL || env.DATABASE_URL === DEFAULT_FALLBACK_URL)
    ) {
      throw new Error(
        'DATABASE_URL is missing. Please add your Neon DATABASE_URL in Vercel Project Settings -> Environment Variables.'
      );
    }
    return Reflect.apply(target, thisArg, argArray);
  },
});

/**
 * Neon connection pool for stateful transactions.
 */
export const pool = new Pool({ connectionString });

export interface TransactionContext {
  query: <R = any>(text: string, params?: any[]) => Promise<R[]>;
  sql: (strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>;
}

/**
 * Executes a function within a database transaction using a dedicated Pool client.
 * Automatically issues BEGIN, COMMIT, and ROLLBACK.
 */
export async function withTransaction<T>(
  fn: (tx: TransactionContext) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tx: TransactionContext = {
      query: async <R = any>(text: string, params: any[] = []): Promise<R[]> => {
        const res = await client.query(text, params);
        return res.rows as R[];
      },
      sql: async (strings: TemplateStringsArray, ...values: any[]): Promise<any[]> => {
        let queryText = '';
        const params: any[] = [];
        for (let i = 0; i < strings.length; i++) {
          queryText += strings[i];
          if (i < values.length) {
            params.push(values[i]);
            queryText += `$${params.length}`;
          }
        }
        const res = await client.query(queryText, params);
        return res.rows;
      },
    };
    const result = await fn(tx);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Helper to run parameterized SQL queries.
 * Example: await query('SELECT * FROM users WHERE email = $1', [email]);
 */
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const result = await sql(text, params);
  return result as T[];
}
