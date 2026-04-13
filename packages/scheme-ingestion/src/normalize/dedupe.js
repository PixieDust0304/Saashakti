export function buildCanonicalKey(candidate) {
  return [norm(candidate.schemeName), norm(candidate.sourceAuthority || 'unknown'), norm(candidate.stateCode || 'central')].join('::');
}

export function dedupeCandidates(candidates) {
  const seen = new Map();
  for (const c of candidates) {
    const key = buildCanonicalKey(c);
    const existing = seen.get(key);
    if (!existing || Number(c.confidenceScore || 0) > Number(existing.confidenceScore || 0)) seen.set(key, c);
  }
  return Array.from(seen.values());
}

function norm(v) { return String(v || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
