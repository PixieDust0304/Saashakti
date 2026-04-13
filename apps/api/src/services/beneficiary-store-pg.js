import { query } from '../db/postgres.js';

export class PostgresBeneficiaryStore {
  async upsertByMobile(input) {
    const upsert = await query(
      `INSERT INTO beneficiaries (mobile_number, aadhaar_status, registration_mode, profile_json)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (mobile_number)
       DO UPDATE SET
         aadhaar_status = EXCLUDED.aadhaar_status,
         registration_mode = EXCLUDED.registration_mode,
         profile_json = EXCLUDED.profile_json,
         updated_at = now()
       RETURNING *`,
      [input.mobileNumber, input.aadhaarStatus, input.registrationMode, JSON.stringify(input.profile)],
    );

    const row = upsert.rows[0];
    return {
      beneficiary: {
        id: String(row.id),
        mobileNumber: row.mobile_number,
        aadhaarStatus: row.aadhaar_status,
        registrationMode: row.registration_mode,
        profile: row.profile_json,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      created: upsert.rowCount === 1,
    };
  }

  async getById(id) {
    const res = await query(`SELECT * FROM beneficiaries WHERE id = $1`, [id]);
    if (res.rowCount === 0) return null;
    const row = res.rows[0];
    return {
      id: String(row.id),
      mobileNumber: row.mobile_number,
      aadhaarStatus: row.aadhaar_status,
      registrationMode: row.registration_mode,
      profile: row.profile_json,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async saveMatches(beneficiaryId, matches) {
    await query(
      `INSERT INTO matched_schemes (beneficiary_id, scheme_id, eligibility_status, annual_value, explanation_hi, explanation_en)
       SELECT $1, x->>'schemeId', x->>'status', (x->>'annualValueInr')::numeric, x->>'explanationHi', x->>'explanationEn'
       FROM jsonb_array_elements($2::jsonb) x`,
      [beneficiaryId, JSON.stringify(matches)],
    );
  }

  async getSummary() {
    const total = await query(`SELECT COUNT(*)::int AS count FROM beneficiaries`);
    const districtRows = await query(
      `SELECT COALESCE(profile_json->>'district', 'unknown') AS district, COUNT(*)::int AS count
       FROM beneficiaries
       GROUP BY COALESCE(profile_json->>'district', 'unknown')`,
    );

    const districtBreakdown = {};
    for (const row of districtRows.rows) districtBreakdown[row.district] = row.count;

    return {
      totalRegistrations: total.rows[0].count,
      districtBreakdown,
    };
  }

  async getRecent(limit = 20, offset = 0) {
    const items = await query(
      `SELECT * FROM beneficiaries ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    const total = await query(`SELECT COUNT(*)::int AS count FROM beneficiaries`);

    return {
      items: items.rows.map((row) => ({
        id: String(row.id),
        mobileNumber: row.mobile_number,
        aadhaarStatus: row.aadhaar_status,
        registrationMode: row.registration_mode,
        profile: row.profile_json,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      total: total.rows[0].count,
      limit,
      offset,
    };
  }
}
