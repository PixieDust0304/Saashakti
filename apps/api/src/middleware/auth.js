import crypto from 'node:crypto';
import { query } from '../db/postgres.js';

export async function requireSession(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;

  const token = auth.split(' ')[1];
  const hash = crypto.createHash('sha256').update(token).digest('hex');

  const res = await query(
    `SELECT * FROM user_sessions WHERE token_hash = $1`,
    [hash],
  );

  return res.rows[0] || null;
}
