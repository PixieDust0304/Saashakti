
/**
 * myScheme.gov.in API Client
 * 
 * myScheme is a Next.js SPA. The frontend calls internal APIs.
 * We discovered the API structure by inspecting the sitemap and network calls.
 * 
 * The sitemap at https://www.myscheme.gov.in/sitemap.xml lists all scheme URLs
 * in the format: /schemes/{slug}
 * 
 * The Next.js data endpoint pattern is:
 * https://www.myscheme.gov.in/_next/data/{buildId}/en/schemes/{slug}.json
 * 
 * Since buildId changes on each deploy, we use an alternative approach:
 * 1. Fetch sitemap to get all scheme slugs
 * 2. Use Playwright to render each scheme page and extract structured data
 * 3. OR use the myScheme search API if available
 */

import { fetchPage } from '../crawler/fetch.js';

const SITEMAP_URL = 'https://www.myscheme.gov.in/sitemap.xml';
const BASE_URL = 'https://www.myscheme.gov.in';

/**
 * Parse sitemap.xml and extract scheme slugs
 */
export async function discoverSchemeSlugs() {
  const result = await fetchPage(SITEMAP_URL, 30000);
  if (!result.ok) {
    console.error(`Failed to fetch sitemap: ${result.status}`);
    return [];
  }

  const slugs = [];
  const regex = /<loc>https?:\/\/www\.myscheme\.gov\.in\/schemes\/([^<]+)<\/loc>/g;
  let match;
  while ((match = regex.exec(result.html))) {
    slugs.push(match[1].trim());
  }

  console.log(`[myScheme] Discovered ${slugs.length} scheme slugs from sitemap`);
  return slugs;
}

/**
 * Get scheme URLs from slugs
 */
export function schemeSlugToUrl(slug) {
  return `${BASE_URL}/schemes/${slug}`;
}

/**
 * Filter slugs that are likely women/welfare relevant
 */
export function filterWomenRelevantSlugs(slugs) {
  const WOMEN_KEYWORDS = [
    'women', 'woman', 'mahila', 'girl', 'beti', 'nari', 'widow',
    'matru', 'maternity', 'pregnant', 'lactating', 'kanya', 'noni',
    'shakti', 'stree', 'swadhar', 'ujjwala', 'sukanya',
    'shg', 'self-help', 'lakhpati', 'didi',
    'pension', 'bpl', 'welfare', 'social', 'assistance',
    'awas', 'housing', 'ration', 'food', 'health',
    'child', 'bal', 'poshan', 'nutrition',
    'skill', 'employment', 'kaushal', 'rozgar',
    'insurance', 'bima', 'jan-dhan', 'mudra',
    'farmer', 'kisan', 'krishi',
    'disability', 'divyang', 'viklang',
    'sc', 'st', 'obc', 'tribal',
    'chhattisgarh',
  ];
  
  return slugs.filter(slug => {
    const lower = slug.toLowerCase();
    return WOMEN_KEYWORDS.some(kw => lower.includes(kw));
  });
}

export default {
  discoverSchemeSlugs,
  schemeSlugToUrl,
  filterWomenRelevantSlugs,
  SITEMAP_URL,
  BASE_URL,
};
