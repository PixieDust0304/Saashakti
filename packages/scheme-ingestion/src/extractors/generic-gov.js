function snippet(text, keywords, len = 500) {
  const lower = text.toLowerCase();
  const idx = keywords.map(k => lower.indexOf(k.toLowerCase())).find(x => x >= 0);
  if (idx == null || idx < 0) return null;
  return text.slice(idx, Math.min(idx + len, text.length)).trim();
}

export function extractGenericGovPage({ url, text, html, stateCode = null, authority = 'state' }) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || 'Unknown Government Page';
  const womenFocused = /women|female|girl|pregnant|widow|\u092e\u0939\u093f\u0932\u093e/i.test(text);
  return {
    sourceUrl: url,
    sourceAuthority: authority,
    sourceHost: new URL(url).host,
    stateCode,
    schemeName: title,
    benefitSummary: snippet(text, ['benefit', 'assistance', '\u0932\u093e\u092d', '\u0938\u0939\u093e\u092f\u0924\u093e']),
    eligibilityText: snippet(text, ['eligibility', 'criteria', '\u092a\u093e\u0924\u094d\u0930\u0924\u093e']),
    applicationProcessText: snippet(text, ['apply', 'application', 'process', '\u0906\u0935\u0947\u0926\u0928']),
    documentsRequiredText: snippet(text, ['documents', '\u0926\u0938\u094d\u0924\u093e\u0935\u0947\u091c']),
    officialApplyUrl: null,
    category: womenFocused ? 'women_welfare' : 'general_welfare',
    womenFocused,
    confidenceScore: womenFocused ? 0.75 : 0.55,
    rawSections: {},
  };
}
