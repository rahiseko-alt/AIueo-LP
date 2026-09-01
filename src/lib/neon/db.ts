import 'server-only';

import { attachDatabasePool } from '@vercel/functions';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

declare global { var __aiueoPool: Pool | undefined; }

function createPool() {
  if (!process.env.DATABASE_URL) return null;
  const pool = global.__aiueoPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  global.__aiueoPool = pool;
  attachDatabasePool(pool);
  return pool;
}

const pool = createPool();
export const db = pool ? drizzle({ client: pool }) : null;
export const databaseReady = Boolean(db);
