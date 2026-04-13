import postgres from 'postgres';
import { env } from '../config/env.js';

export const sql = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === 'test' ? 5 : 20,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});

export type Sql = typeof sql;
