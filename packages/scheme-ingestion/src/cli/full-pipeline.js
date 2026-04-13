
/**
 * Full ingestion pipeline CLI
 * Usage: node src/cli/full-pipeline.js [--playwright] [--limit N] [--women-only]
 */

import { discoverSchemeSlugs, schemeSlugToUrl, filterWomenRelevantSlugs } from '../sources/myscheme-api.js';
import { discoverFromSeed } from '../crawler/discover.js';
import { fetchPage } from '../crawler/fetch.js';
import { htmlToText, extractTitle } from '../crawler/text-extract.js';
import { extractMySchemeRendered } from '../extractors/myscheme-rendered.js';
import { extractGenericGovPage } from '../extractors/generic-gov.js';
import { normalizeAndDedupe } from '../normalize/enhanced-normalizer.js';
import { centralSeeds } from '../seeds/central.js';
import { chhattisgarhSeeds } from '../seeds/chhattisgarh.js';
import crypto from 'node:crypto';
import fs from 'node:fs';

const args = process.argv.slice(2);
const usePlaywright = args.includes('--playwright');
const womenOnly = args.includes('--women-only');
const limitArg = args.find(a => a.startsWith('--limit'));
const limit = limitArg ? parseInt(limitArg.split('=')[1] || args[args.indexOf('--limit') + 1]) : 50;

async function main() {
  console.log('=== SAASHAKTI SCHEME INGESTION PIPELINE ===');
  console.log(`Mode: ${usePlaywright ? 'Playwright (JS-rendered)' : 'Static fetch'}`);
  console.log(`Limit: ${limit} URLs`);
  console.log(`Women-only filter: ${womenOnly}`);
  console.log('');

  // STEP 1: Discover scheme URLs
  console.log('[1/5] DISCOVERING SCHEME URLS...');
  let allUrls = [];

  // From myScheme sitemap
  try {
    const slugs = await discoverSchemeSlugs();
    let filtered = womenOnly ? filterWomenRelevantSlugs(slugs) : slugs;
    filtered = filtered.slice(0, limit);
    allUrls.push(...filtered.map(s => schemeSlugToUrl(s)));
    console.log(`  myScheme: ${slugs.length} total, ${filtered.length} selected`);
  } catch (err) {
    console.log(`  myScheme sitemap failed: ${err.message}`);
  }

  // From CG/central seeds
  const seeds = [...centralSeeds, ...chhattisgarhSeeds];
  for (const seed of seeds) {
    try {
      const result = await discoverFromSeed(seed);
      allUrls.push(...(result.discovered || []));
      console.log(`  ${seed.url}: ${result.discovered?.length || 0} URLs`);
    } catch (err) {
      console.log(`  ${seed.url}: failed — ${err.message}`);
    }
  }

  allUrls = [...new Set(allUrls)].slice(0, limit);
  console.log(`  Total unique URLs: ${allUrls.length}`);
  console.log('');

  // STEP 2: Fetch pages
  console.log('[2/5] FETCHING PAGES...');
  const documents = [];

  if (usePlaywright) {
    const { fetchRenderedPages, closeBrowser } = await import('../crawler/playwright-fetch.js');
    try {
      const results = await fetchRenderedPages(allUrls, { concurrency: 2, delayMs: 3000 });
      for (const r of results) {
        if (r.ok) {
          documents.push({
            sourceUrl: r.url,
            sourceHost: new URL(r.url).host,
            sourceType: r.url.includes('myscheme') ? 'myscheme' : 'generic_gov',
            httpStatus: r.status,
            contentType: r.contentType,
            title: r.title,
            rawHtml: r.html,
            rawText: r.text || htmlToText(r.html),
            checksum: crypto.createHash('sha256').update(r.text || '').digest('hex'),
          });
        }
      }
      await closeBrowser();
    } catch (err) {
      console.log(`  Playwright failed: ${err.message}`);
    }
  } else {
    for (const url of allUrls) {
      try {
        const page = await fetchPage(url);
        if (page.ok) {
          const rawText = htmlToText(page.html);
          documents.push({
            sourceUrl: url,
            sourceHost: new URL(url).host,
            sourceType: url.includes('myscheme') ? 'myscheme' : 'generic_gov',
            httpStatus: page.status,
            contentType: page.contentType,
            title: extractTitle(page.html),
            rawHtml: page.html,
            rawText,
            checksum: crypto.createHash('sha256').update(rawText).digest('hex'),
          });
        }
      } catch (err) {
        // skip
      }
    }
  }
  console.log(`  Fetched: ${documents.length} pages`);
  console.log('');

  // STEP 3: Extract candidates
  console.log('[3/5] EXTRACTING SCHEME CANDIDATES...');
  const candidates = [];
  for (const doc of documents) {
    let extracted = null;
    if (doc.sourceHost.includes('myscheme.gov.in')) {
      extracted = extractMySchemeRendered({
        url: doc.sourceUrl,
        text: doc.rawText,
        html: doc.rawHtml,
        title: doc.title,
      });
    } else if (doc.sourceHost.endsWith('.gov.in') || doc.sourceHost.includes('.nic.in')) {
      extracted = extractGenericGovPage({
        url: doc.sourceUrl,
        text: doc.rawText,
        html: doc.rawHtml,
        stateCode: /chhattisgarh|cg/i.test(doc.sourceUrl) ? 'CG' : null,
        authority: /district|nic\.in/i.test(doc.sourceUrl) ? 'district' : 'state',
      });
    }
    if (extracted && extracted.schemeName) {
      candidates.push(extracted);
    }
  }
  console.log(`  Extracted: ${candidates.length} scheme candidates`);
  if (womenOnly) {
    const womenCandidates = candidates.filter(c => c.womenFocused);
    console.log(`  Women-focused: ${womenCandidates.length}`);
  }
  console.log('');

  // STEP 4: Normalize + dedupe
  console.log('[4/5] NORMALIZING AND DEDUPLICATING...');
  const normalized = normalizeAndDedupe(candidates);
  console.log(`  Normalized: ${normalized.length} unique schemes`);
  console.log('');

  // STEP 5: Output
  console.log('[5/5] WRITING OUTPUT...');
  
  const output = {
    version: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
    pipelineRun: {
      urlsDiscovered: allUrls.length,
      pagesFetched: documents.length,
      candidatesExtracted: candidates.length,
      schemesNormalized: normalized.length,
      mode: usePlaywright ? 'playwright' : 'static',
      womenOnlyFilter: womenOnly,
    },
    schemes: normalized.map(n => n.normalized),
    candidates: normalized.map(n => ({
      sourceUrl: n.candidate.sourceUrl,
      schemeName: n.candidate.schemeName,
      womenFocused: n.candidate.womenFocused,
      confidenceScore: n.candidate.confidenceScore,
      category: n.candidate.category,
    })),
  };

  const outPath = 'output/ingested-schemes.json';
  fs.mkdirSync('output', { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`  Written to: ${outPath}`);
  console.log(`  Total schemes: ${output.schemes.length}`);
  console.log('');

  // Also write a merge-ready file that can be combined with existing registry
  const mergePath = 'output/new-schemes-for-review.json';
  fs.writeFileSync(mergePath, JSON.stringify(output.schemes, null, 2), 'utf-8');
  console.log(`  Review file: ${mergePath}`);
  console.log('');

  // Summary
  console.log('=== PIPELINE COMPLETE ===');
  console.log(`  URLs discovered: ${allUrls.length}`);
  console.log(`  Pages fetched:   ${documents.length}`);
  console.log(`  Candidates:      ${candidates.length}`);
  console.log(`  Final schemes:   ${normalized.length}`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Review output/new-schemes-for-review.json');
  console.log('  2. Verify eligibility rules are correct');
  console.log('  3. Merge approved schemes into packages/scheme-registry/src/data/schemes.json');
}

main().catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
