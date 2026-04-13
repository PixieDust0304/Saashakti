import { buildCanonicalKey } from '../normalize/dedupe.js';

export async function runPublish(items, canonicalRepo) {
  const published = [];
  for (const item of items) {
    const key = buildCanonicalKey(item.candidate);
    const result = await canonicalRepo.upsert(key, item.normalized);
    published.push(result);
  }
  return published;
}
