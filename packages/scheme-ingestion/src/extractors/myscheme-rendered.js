
/**
 * Extract scheme data from a Playwright-rendered myScheme page
 * myScheme pages have structured sections: Benefits, Eligibility, Application Process, Documents
 */

export function extractMySchemeRendered({ url, text, html, title }) {
  if (!text || text.length < 100) {
    return null; // Page didn't render properly
  }

  const schemeName = extractSchemeName(text, title);
  if (!schemeName || schemeName === 'myScheme') return null;

  return {
    sourceUrl: url,
    sourceAuthority: detectAuthority(text),
    sourceHost: 'myscheme.gov.in',
    sourceType: 'myscheme',
    stateCode: detectState(text),
    ministryOrDepartment: extractField(text, ['ministry', 'department', 'मंत्रालय', 'विभाग']),
    schemeName,
    schemeSlug: url.split('/schemes/')[1] || null,
    benefitSummary: extractSection(text, ['benefits', 'benefit', 'लाभ']),
    eligibilityText: extractSection(text, ['eligibility', 'eligible', 'who can apply', 'पात्रता']),
    applicationProcessText: extractSection(text, ['how to apply', 'application process', 'आवेदन प्रक्रिया']),
    documentsRequiredText: extractSection(text, ['documents required', 'required documents', 'आवश्यक दस्तावेज']),
    officialApplyUrl: extractApplyUrl(text),
    category: detectCategory(text),
    womenFocused: isWomenFocused(text),
    targetGroups: extractTargetGroups(text),
    confidenceScore: 0.92,
    rawText: text.slice(0, 5000),
    rawSections: extractAllSections(text),
  };
}

function extractSchemeName(text, title) {
  // Try title first
  if (title && !title.includes('myScheme') && title.length > 5) {
    return title.replace(/\s*\|.*$/, '').replace(/\s*-\s*myScheme.*$/i, '').trim();
  }
  // Try first significant heading in text
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 10 && l.length < 200);
  return lines[0] || null;
}

function extractSection(text, keywords) {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    const idx = lower.indexOf(kw.toLowerCase());
    if (idx >= 0) {
      // Find the start of this section and capture up to 800 chars
      const start = idx;
      const section = text.slice(start, Math.min(start + 800, text.length));
      // Try to cut at a sentence boundary
      const endMatch = section.match(/[.।\n]{2,}/);
      if (endMatch && endMatch.index > 100) {
        return section.slice(0, endMatch.index + 1).trim();
      }
      return section.trim();
    }
  }
  return null;
}

function extractField(text, keywords) {
  for (const kw of keywords) {
    const regex = new RegExp(`${kw}[:\\s]+([^\\n]{5,100})`, 'i');
    const match = text.match(regex);
    if (match) return match[1].trim();
  }
  return null;
}

function extractApplyUrl(text) {
  const match = text.match(/(?:apply|application|आवेदन).*?(https?:\/\/[^\s"'<>]+)/i);
  return match ? match[1] : null;
}

function detectAuthority(text) {
  if (/central\s*(?:government|govt|sector)|केंद्र\s*सरकार/i.test(text)) return 'central';
  if (/state\s*(?:government|govt|sector)|राज्य\s*सरकार/i.test(text)) return 'state';
  return 'central'; // myScheme default
}

function detectState(text) {
  const stateMap = {
    'chhattisgarh': 'CG', 'छत्तीसगढ़': 'CG',
    'madhya pradesh': 'MP', 'uttar pradesh': 'UP',
    'rajasthan': 'RJ', 'bihar': 'BR', 'odisha': 'OD',
    'jharkhand': 'JH', 'maharashtra': 'MH',
  };
  const lower = text.toLowerCase();
  for (const [name, code] of Object.entries(stateMap)) {
    if (lower.includes(name)) return code;
  }
  return null;
}

function detectCategory(text) {
  const lower = text.toLowerCase();
  if (/pension|पेंशन/.test(lower)) return 'pension';
  if (/maternity|pregnancy|गर्भ/.test(lower)) return 'maternity';
  if (/education|शिक्षा|scholarship/.test(lower)) return 'education';
  if (/health|स्वास्थ्य|medical/.test(lower)) return 'health';
  if (/housing|आवास|awas/.test(lower)) return 'housing';
  if (/skill|कौशल|training/.test(lower)) return 'skill_training';
  if (/insurance|बीमा/.test(lower)) return 'insurance';
  if (/loan|ऋण|credit/.test(lower)) return 'financial';
  return 'welfare';
}

function isWomenFocused(text) {
  return /women|woman|female|girl|pregnant|lactating|widow|mahila|beti|kanya|noni|stree|बालिका|महिला|गर्भवती|विधवा|बेटी|कन्या/i.test(text);
}

function extractTargetGroups(text) {
  const groups = [];
  const lower = text.toLowerCase();
  if (/women|woman|female|महिला/.test(lower)) groups.push('women');
  if (/girl|beti|kanya|बेटी|कन्या|बालिका/.test(lower)) groups.push('girl_child');
  if (/pregnant|गर्भवती/.test(lower)) groups.push('pregnant');
  if (/widow|विधवा/.test(lower)) groups.push('widow');
  if (/bpl|below poverty|गरीबी/.test(lower)) groups.push('bpl');
  if (/sc|st|scheduled|अनुसूचित/.test(lower)) groups.push('sc_st');
  if (/farmer|kisan|किसान/.test(lower)) groups.push('farmer');
  if (/senior|elderly|वृद्ध|60/.test(lower)) groups.push('senior_citizen');
  if (/disabled|disability|विकलांग|दिव्यांग/.test(lower)) groups.push('disabled');
  if (/shg|self.help|स्वयं सहायता/.test(lower)) groups.push('shg');
  return groups;
}

function extractAllSections(text) {
  const sections = {};
  const sectionNames = [
    'benefits', 'eligibility', 'application process', 'documents required',
    'how to apply', 'frequently asked questions', 'contact',
  ];
  for (const name of sectionNames) {
    const content = extractSection(text, [name]);
    if (content) sections[name] = content;
  }
  return sections;
}
