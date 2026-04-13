const ALLOW = [/scheme/i,/yojana/i,/benefit/i,/welfare/i,/women/i,/child/i,/development/i,/pension/i,/maternity/i,/mahila/i];
const BLOCK = [/\.jpe?g$/i,/\.png$/i,/\.gif$/i,/\.svg$/i,/\.zip$/i,/\.mp[34]$/i,/mailto:/i,/javascript:/i,/\.pdf$/i];

export function isCandidateUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (BLOCK.some(p => p.test(url))) return false;
  return ALLOW.some(p => p.test(url));
}

export function normalizeUrl(baseUrl, href) {
  try { return new URL(href, baseUrl).toString(); } catch { return null; }
}

export function isSameHost(baseUrl, candidateUrl) {
  try { return new URL(baseUrl).host === new URL(candidateUrl).host; } catch { return false; }
}
