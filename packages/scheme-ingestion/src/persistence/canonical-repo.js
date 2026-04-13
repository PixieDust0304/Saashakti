export class CanonicalRepo {
  constructor(sql) { this.sql = sql; }

  async upsert(canonicalKey, scheme) {
    const benefitJson = JSON.stringify({ annualValueInr: scheme.annualValueInr });
    const eligibilityJson = JSON.stringify({ rules: scheme.rules, exclusions: scheme.exclusions || [] });
    const applicationJson = JSON.stringify({ nextActionHi: scheme.nextActionHi, nextActionEn: scheme.nextActionEn });
    const sourceUrls = JSON.stringify([scheme.sourceMeta?.sourceUrl].filter(Boolean));
    const version = new Date().toISOString();

    const [row] = await this.sql`
      INSERT INTO canonical_schemes (canonical_key, scheme_name_hi, scheme_name_en, source_priority, authority_type, state_code, department_name, benefit_json, eligibility_json, application_json, source_urls, version, last_verified_at, is_published)
      VALUES (${canonicalKey}, ${scheme.nameHi}, ${scheme.nameEn}, 1, ${scheme.sourceMeta?.authority || 'central'}, ${scheme.sourceMeta?.stateCode || null}, ${null}, ${benefitJson}::jsonb, ${eligibilityJson}::jsonb, ${applicationJson}::jsonb, ${sourceUrls}::jsonb, ${version}, now(), false)
      ON CONFLICT (canonical_key) DO UPDATE SET
        scheme_name_hi = EXCLUDED.scheme_name_hi,
        scheme_name_en = EXCLUDED.scheme_name_en,
        benefit_json = EXCLUDED.benefit_json,
        eligibility_json = EXCLUDED.eligibility_json,
        application_json = EXCLUDED.application_json,
        source_urls = EXCLUDED.source_urls,
        version = EXCLUDED.version,
        last_verified_at = now(),
        updated_at = now()
      RETURNING *`;
    return row;
  }
}
