import { normalizeCandidateToRegistryScheme } from '../normalize/scheme-normalizer.js';
import { dedupeCandidates } from '../normalize/dedupe.js';

export async function runNormalize(candidates) {
  const deduped = dedupeCandidates(candidates);
  return deduped.map(candidate => ({ candidate, normalized: normalizeCandidateToRegistryScheme(candidate) }));
}
