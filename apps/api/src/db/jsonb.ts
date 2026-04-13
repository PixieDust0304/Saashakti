import { sql } from './client.js';

type SqlJsonArg = Parameters<typeof sql.json>[0];

export const toJsonb = (value: unknown) => sql.json(value as SqlJsonArg);
