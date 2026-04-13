import { env } from '../config/env.js';
import { sql } from '../db/client.js';
import { redis, keys } from '../redis/client.js';

export interface DashboardSummary {
  totals: {
    beneficiaries: number;
    profiles: number;
    matches: number;
    last24hBeneficiaries: number;
  };
  byDistrict: Array<{ district: string; count: number }>;
  byAadhaarStatus: Array<{ status: string; count: number }>;
  generatedAt: string;
}

export interface DashboardRecentEntry {
  beneficiaryId: number;
  mobileNumber: string;
  district: string | null;
  aadhaarStatus: string;
  createdAt: string;
}

const cacheGetJson = async <T>(key: string): Promise<T | null> => {
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const cacheSetJson = async (key: string, value: unknown): Promise<void> => {
  if (env.DASHBOARD_CACHE_TTL_SECONDS <= 0) return;
  await redis.set(key, JSON.stringify(value), 'EX', env.DASHBOARD_CACHE_TTL_SECONDS);
};

export const getSummary = async (): Promise<DashboardSummary> => {
  const key = keys.dashboardSummary();
  const cached = await cacheGetJson<DashboardSummary>(key);
  if (cached) return cached;

  const [[totals], byDistrict, byAadhaar] = await Promise.all([
    sql<{ beneficiaries: string; profiles: string; matches: string; last24h: string }[]>`
      SELECT
        (SELECT COUNT(*)::text FROM beneficiaries) AS beneficiaries,
        (SELECT COUNT(*)::text FROM beneficiary_profiles) AS profiles,
        (SELECT COUNT(*)::text FROM matched_schemes) AS matches,
        (SELECT COUNT(*)::text FROM beneficiaries WHERE created_at > NOW() - INTERVAL '24 hours') AS last24h
    `,
    sql<{ district: string; count: string }[]>`
      SELECT COALESCE(p.district, 'unknown') AS district, COUNT(*)::text AS count
      FROM beneficiaries b
      LEFT JOIN beneficiary_profiles p ON p.beneficiary_id = b.id
      GROUP BY COALESCE(p.district, 'unknown')
      ORDER BY COUNT(*) DESC
      LIMIT 20
    `,
    sql<{ status: string; count: string }[]>`
      SELECT aadhaar_status AS status, COUNT(*)::text AS count
      FROM beneficiaries
      GROUP BY aadhaar_status
    `,
  ]);

  const summary: DashboardSummary = {
    totals: {
      beneficiaries: Number(totals?.beneficiaries ?? 0),
      profiles: Number(totals?.profiles ?? 0),
      matches: Number(totals?.matches ?? 0),
      last24hBeneficiaries: Number(totals?.last24h ?? 0),
    },
    byDistrict: byDistrict.map((r) => ({ district: r.district, count: Number(r.count) })),
    byAadhaarStatus: byAadhaar.map((r) => ({ status: r.status, count: Number(r.count) })),
    generatedAt: new Date().toISOString(),
  };

  await cacheSetJson(key, summary);
  return summary;
};

export const getRecent = async (limit = 20): Promise<DashboardRecentEntry[]> => {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const key = keys.dashboardRecent(safeLimit);
  const cached = await cacheGetJson<DashboardRecentEntry[]>(key);
  if (cached) return cached;

  const rows = await sql<
    {
      id: number;
      mobile_number: string;
      district: string | null;
      aadhaar_status: string;
      created_at: Date;
    }[]
  >`
    SELECT b.id, b.mobile_number, p.district, b.aadhaar_status, b.created_at
    FROM beneficiaries b
    LEFT JOIN beneficiary_profiles p ON p.beneficiary_id = b.id
    ORDER BY b.created_at DESC
    LIMIT ${safeLimit}
  `;

  const out: DashboardRecentEntry[] = rows.map((r) => ({
    beneficiaryId: r.id,
    mobileNumber: r.mobile_number,
    district: r.district,
    aadhaarStatus: r.aadhaar_status,
    createdAt: r.created_at.toISOString(),
  }));

  await cacheSetJson(key, out);
  return out;
};
