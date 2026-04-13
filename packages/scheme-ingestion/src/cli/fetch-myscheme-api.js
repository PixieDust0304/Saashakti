
/**
 * Fetch all scheme data from myScheme using Playwright
 * Usage: node src/cli/fetch-myscheme-api.js [--limit 20] [--women-only]
 */

import { discoverSchemeSlugs, schemeSlugToUrl, filterWomenRelevantSlugs } from '../sources/myscheme-api.js';
import { fetchRenderedPages, closeBrowser } from '../crawler/playwright-fetch.js';
import { extractMySchemeRendered } from '../extractors/myscheme-rendered.js';
import { normalizeAndDedupe } from '../normalize/enhanced-normalizer.js';
import fs from 'node:fs';

const args = process.argv.slice(2);
const womenOnly = args.includes('--women-only');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 20;

async function main() {
  console.log('=== MYSCHEME.GOV.IN FETCHER ===');
  
  // Discover slugs
  console.log('[1] Fetching sitemap...');
  let slugs = await discoverSchemeSlugs();
  
  if (womenOnly) {
    slugs = filterWomenRelevantSlugs(slugs);
    console.log(`  Women-relevant: ${slugs.length}`);
  }
  
  slugs = slugs.slice(0, limit);
  const urls = slugs.map(schemeSlugToUrl);
  console.log(`  Processing: ${urls.length} schemes`);

  // Fetch with Playwright
  console.log('[2] Rendering pages with Playwright...');
  const pages = await fetchRenderedPages(urls, {
    concurrency: 2,
    delayMs: 3000,
    waitForSelector: 'h1',
  });
  
  const successful = pages.filter(p => p.ok);
  console.log(`  Rendered: ${successful.length}/${pages.length}`);

  // Extract
  console.log('[3] Extracting scheme data...');
  const candidates = [];
  for (const page of successful) {
    const extracted = extractMySchemeRendered({
      url: page.url,
      text: page.text,
      html: page.html,
      title: page.title,
    });
    if (extracted && extracted.schemeName) {
      candidates.push(extracted);
      console.log(`  ✓ ${extracted.schemeName} (women: ${extracted.womenFocused})`);
    }
  }

  // Normalize
  console.log('[4] Normalizing...');
  const normalized = normalizeAndDedupe(candidates);

  // Output
  const outDir = 'output';
  fs.mkdirSync(outDir, { recursive: true });
  
  fs.writeFileSync(`${outDir}/myscheme-raw-candidates.json`, JSON.stringify(candidates, null, 2), 'utf-8');
  fs.writeFileSync(`${outDir}/myscheme-normalized.json`, JSON.stringify(normalized.map(n => n.normalized), null, 2), 'utf-8');
  
  console.log(`\n✅ Done: ${normalized.length} schemes extracted`);
  console.log(`  Raw: ${outDir}/myscheme-raw-candidates.json`);
  console.log(`  Normalized: ${outDir}/myscheme-normalized.json`);

  await closeBrowser();
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
