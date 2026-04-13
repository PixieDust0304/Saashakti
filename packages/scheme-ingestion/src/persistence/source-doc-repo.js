export class SourceDocRepo {
  constructor(sql) { this.sql = sql; }

  async save(doc) {
    const [row] = await this.sql`
      INSERT INTO scheme_source_documents (source_type, source_url, source_host, fetched_at, http_status, content_type, title, raw_html, raw_text, checksum, is_active)
      VALUES (${doc.sourceType}, ${doc.sourceUrl}, ${doc.sourceHost}, now(), ${doc.httpStatus}, ${doc.contentType}, ${doc.title || null}, ${doc.rawHtml}, ${doc.rawText}, ${doc.checksum || null}, true)
      RETURNING *`;
    return row;
  }
}
