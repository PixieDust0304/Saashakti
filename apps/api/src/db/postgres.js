import pg from 'pg';

const { Pool } = pg;

let pool;

export function getPgPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
    });
  }
  return pool;
}

export async function query(text, params = []) {
  const client = getPgPool();
  return client.query(text, params);
}
