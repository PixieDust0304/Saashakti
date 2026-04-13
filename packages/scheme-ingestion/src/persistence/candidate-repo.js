export class CandidateRepo {
  constructor(sql) { this.sql = sql; }

  async save(candidate) {
    const [row] = await this.sql`
      INSERT INTO scheme_candidates (source_document_id, source_url, source_authority, state_code, ministry_or_department, scheme_name, scheme_slug, benefit_summary, eligibility_text, application_process_text, documents_required_text, official_apply_url, category, women_focused, extracted_json, confidence_score)
      VALUES (${candidate.sourceDocumentId || null}, ${candidate.sourceUrl}, ${candidate.sourceAuthority}, ${candidate.stateCode || null}, ${candidate.ministryOrDepartment || null}, ${candidate.schemeName}, ${candidate.schemeSlug || null}, ${candidate.benefitSummary || null}, ${candidate.eligibilityText || null}, ${candidate.applicationProcessText || null}, ${candidate.documentsRequiredText || null}, ${candidate.officialApplyUrl || null}, ${candidate.category || null}, ${Boolean(candidate.womenFocused)}, ${JSON.stringify(candidate)}, ${candidate.confidenceScore || 0})
      RETURNING *`;
    return row;
  }
}
