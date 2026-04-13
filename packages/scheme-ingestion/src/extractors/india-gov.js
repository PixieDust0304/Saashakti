function snippet(text, keywords, len = 500) {
  const lower = text.toLowerCase();
  const idx = keywords.map(k => lower.indexOf(k.toLowerCase())).find(x => x >= 0);
  if (idx == null || idx < 0) return null;
  return text.slice(idx, Math.min(idx + len, text.length)).trim();
}

export function extractIndiaGovPage({ url, text, html }) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  return {
    sourceUrl: url,
    sourceAuthority: 'central',
    sourceHost: 'india.gov.in',
    schemeName: titleMatch?.[1]?.trim() || 'Unknown Scheme',
    benefitSummary: snippet(text, ['benefit', '\u0932\u093e\u092d']),
    eligibilityText: snippet(text, ['eligibility', '\u092a\u093e\u0924\u094d\u0930\u0924\u093e']),
    applicationProcessText: snippet(text, ['apply', 'application', '\u0906\u0935\u0947\u0926\u0928']),
    documentsRequiredText: snippet(text, ['documents', '\u0926\u0938\u094d\u0924\u093e\u0935\u0947\u091c']),
    officialApplyUrl: null,
    category: 'government_scheme',
    womenFocused: /women|female|pregnant|widow|girl|\u092e\u0939\u093f\u0932\u093e/i.test(text),
    confidenceScore: 0.8,
    rawSections: {},
  };
}
