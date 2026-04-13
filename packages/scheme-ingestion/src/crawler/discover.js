import { extractLinks } from './text-extract.js';
import { isCandidateUrl, isSameHost, normalizeUrl } from './url-filter.js';
import { fetchPage } from './fetch.js';

export async function discoverFromSeed(seed) {
  const page = await fetchPage(seed.url);
  if (!page.ok) return { seed, discovered: [], error: page.error || `HTTP ${page.status}` };
  const rawLinks = extractLinks(page.html);
  const discovered = rawLinks
    .map(href => normalizeUrl(seed.url, href))
    .filter(Boolean)
    .filter(url => isSameHost(seed.url, url))
    .filter(url => isCandidateUrl(url));
  return { seed, discovered: [...new Set(discovered)] };
}
