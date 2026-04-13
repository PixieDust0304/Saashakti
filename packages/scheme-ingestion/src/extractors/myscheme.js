function snippet(text, keywords, len = 600) {
  const lower = text.toLowerCase();
  const idx = keywords.map(k => lower.indexOf(k.toLowerCase())).find(x => x >= 0);
  if (idx == null || idx < 0) return null;
  return text.slice(idx, Math.min(idx + len, text.length)).trim();
}

export function extractMySchemePage({ url, text, html }) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  return {
    sourceUrl: url,
    sourceAuthority: 'central',
    sourceHost: 'myscheme.gov.in',
    schemeName: titleMatch?.[1]?.trim() || 'Unknown Scheme',
    benefitSummary: snippet(text, ['benefit', 'benefits', '\u0932\u093e\u092d']),
    eligibilityText: snippet(text, ['eligibility', 'eligible', '\u092a\u093e\u0924\u094d\u0930\u0924\u093e']),
    applicationProcessText: snippet(text, ['how to apply', 'application process', '\u0906\u0935\u0947\u0926\u0928']),
    documentsRequiredText: snippet(text, ['documents required', '\u0926\u0938\u094d\u0924\u093e\u0935\u0947\u091c']),
    officialApplyUrl: null,
    category: 'general_welfare',
    womenFocused: /women|female|pregnant|widow|girl|\u092e\u0939\u093f\u0932\u093e|\u0917\u0930\u094d\u092d\u0935\u0924\u0940|\u092c\u093e\u0932\u093f\u0915\u093e/i.test(text),
    confidenceScore: 0.9,
    rawSections: {},
  };
}
