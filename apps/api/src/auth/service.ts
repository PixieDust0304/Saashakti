import { createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import { sql } from '../db/client.js';
import { HttpError } from '../plugins/error-handler.js';

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

export interface Session {
  id: number;
  mobileNumber: string;
  authStatus: string;
  expiresAt: Date;
}

export const issueSession = async (mobileNumber: string): Promise<{ token: string; expiresAt: Date }> => {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_SECONDS * 1000);

  await sql`
    INSERT INTO user_sessions (mobile_number, auth_status, token_hash, expires_at)
    VALUES (${mobileNumber}, 'active', ${tokenHash}, ${expiresAt})
  `;

  return { token, expiresAt };
};

export const verifySession = async (token: string): Promise<Session> => {
  if (!token) throw new HttpError(401, 'unauthenticated', 'Missing session token');
  const tokenHash = hashToken(token);

  const [row] = await sql<
    { id: number; mobile_number: string; auth_status: string; expires_at: Date }[]
  >`
    SELECT id, mobile_number, auth_status, expires_at
    FROM user_sessions
    WHERE token_hash = ${tokenHash} AND auth_status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (!row) throw new HttpError(401, 'invalid_session', 'Invalid session token');
  if (row.expires_at.getTime() < Date.now()) {
    throw new HttpError(401, 'session_expired', 'Session expired — sign in again');
  }

  return {
    id: row.id,
    mobileNumber: row.mobile_number,
    authStatus: row.auth_status,
    expiresAt: row.expires_at,
  };
};

export const revokeSession = async (token: string): Promise<void> => {
  const tokenHash = hashToken(token);
  await sql`UPDATE user_sessions SET auth_status = 'revoked' WHERE token_hash = ${tokenHash}`;
};
