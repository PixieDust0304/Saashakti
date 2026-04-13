import { createClient, ApiError } from '@saashakti/api-client';
import type {
  DashboardRecentEntry,
  DashboardSummary,
  IntakeRequest,
  IntakeResponse,
} from '@saashakti/api-client';

/**
 * Single place where the admin-web talks to the Saashakti backend.
 *
 * Dev: leave VITE_API_URL unset and the Vite dev server proxies
 *      /v1/* and /health to http://localhost:3001.
 * Prod: set VITE_API_URL at build time.
 */
const baseUrl: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

export const api = createClient({ baseUrl });
export { ApiError };
export type { DashboardSummary, DashboardRecentEntry, IntakeRequest, IntakeResponse };

/**
 * Opportunistic availability probe. Used by pages that want to fall back
 * to Supabase when the backend isn't reachable (local dev without the
 * API running).
 */
export const isApiReachable = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${baseUrl}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Cache the availability check for the lifetime of a page load so
 * repeated calls don't spam /health.
 */
let cachedAvailable: boolean | null = null;
export const apiAvailable = async (): Promise<boolean> => {
  if (cachedAvailable !== null) return cachedAvailable;
  cachedAvailable = await isApiReachable();
  return cachedAvailable;
};
