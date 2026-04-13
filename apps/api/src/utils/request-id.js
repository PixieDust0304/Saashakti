import crypto from 'node:crypto';

export const createRequestId = () => crypto.randomUUID();
