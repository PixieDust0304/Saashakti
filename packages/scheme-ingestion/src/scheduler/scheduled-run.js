
/**
 * Scheduled ingestion runner
 * Designed to run via cron: daily for Tier 1, weekly for Tier 2/3
 * 
 * Usage:
 *   node src/scheduler/scheduled-run.js --tier 1          # daily: myScheme + india.gov
 *   node src/scheduler/scheduled-run.js --tier 2          # weekly: CG state portals
 *   node src/scheduler/scheduled-run.js --tier all        # everything
 *   node src/scheduler/scheduled-run.js --tier 1 --ai     # with AI rule extraction
 * 
 * Cron examples:
 *   0 2 * * *   node scheduled-run.js --tier 1            # daily 2 AM
 *   0 3 * * 0   node scheduled-run.js --tier 2            # weekly Sunday 3 AM
 *   0 4 1 * *   node scheduled-run.js --tier all --ai     # monthly 1st, 4 AM, with AI
 */

import { discoverSchemeSlugs, schemeSlugToUrl, filterWomenRelevantSlugs } from '../sources/myscheme-api.js';
import { discoverFromSeed } from '../crawler/discover.js';
import { fetchPage } from '../crawler/fetch.js';
import { htmlToText, extractTitle } from '../crawler/text-extract.js';
import { extractMySchemeRendered } from '../extractors/myscheme-rendered.js';
import { extractGenericGovPage } from '../extractors/generic-gov.js';
import { normalizeAndDedupe } from '../normalize/enhanced-normalizer.js';
import { loadChecksums, saveChecksums, detectChanges, logChanges, computeChecksum } from '../changelog/change-detector.js';
import { centralSeeds } from '../seeds/central.js';
import { chhattisgarhSeeds } from '../seeds/chhattisgarh.js';
import crypto from 'node:crypto';
import fs from 'node:fs';

const args = process.argv.slice(2);
const tier = args.find(a => a.startsWith('--tier'))?.split('=')[1] || args[args.indexOf('--tier') + 1] || 'all';
const useAI = args.includes('--ai');
const aiKey = process.env.ANTHROPIC_API_KEY || '';
const limit = parseInt(args.find(a => a.startsWith('--limit'))?.split('=')[1] || '100');

const TIERS = {
  '1': { label: 'Tier 1 — Authoritative aggregators (daily)', seeds: centralSeeds, myscheme: true },
  '2': { label: 'Tier 2 — CG state/district portals (weekly)', seeds: chhattisgarhSeeds, myscheme: false },
  'all': { label: 'All tiers', seeds: [...centralSeeds, ...chhattisgarhSeeds], myscheme: true },
};

async function main() {
  const config = TIERS[tier] || TIERS['all'];
  const runId = `run-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
  
  console.log(`=== SAASHAKTI SCHEDULED INGESTION ===`);
  console.log(`Run ID: ${runId}`);
  console.log(`Tier: ${config.label}`);
  console.log(`AI extraction: ${useAI ? 'ON' : 'OFF'}`);
  console.log(`Limit: ${limit} URLs`);
  console.log('');

  // Load previous checksums
  const previousChecksums = loadChecksums();
  console.log(`[checksums] Loaded ${Object.keys(previousChecksums).length} previous checksums`);

  // ── STEP 1: Discover URLs ──
  console.log('[1/5] DISCOVERING...');
  let allUrls = [];

  if (config.myscheme) {
    try {
      const slugs = await discoverSchemeSlugs();
      const women = filterWomenRelevantSlugs(slugs);
      allUrls.push(...women.slice(0, limit).map(s => schemeSlugToUrl(s)));
      console.log(`  myScheme: ${slugs.length} total, ${women.length} women-relevant`);
    } catch (err) {
      console.log(`  myScheme: ${err.message}`);
    }
  }

  for (const seed of config.seeds) {
    try {
      const r = await discoverFromSeed(seed);
      allUrls.push(...(r.discovered || []));
      console.log(`  ${seed.url}: ${r.discovered?.length || 0} URLs`);
    } catch (err) {
      console.log(`  ${seed.url}: ${err.message}`);
    }
  }

  allUrls = [...new Set(allUrls)].slice(0, limit);
  console.log(`  Total: ${allUrls.length} URLs`);

  // ── STEP 2: Fetch pages ──
  console.log('[2/5] FETCHING...');
  const documents = [];
  let usePlaywright = false;

  try {
    // Try Playwright first for better SPA support
    const pw = await import('../crawler/playwright-fetch.js');
    usePlaywright = true;
    const results = await pw.fetchRenderedPages(allUrls, { concurrency: 2, delayMs: 2000 });
    for (const r of results) {
      if (r.ok) {
        documents.push({
          sourceUrl: r.url, sourceHost: new URL(r.url).host,
          title: r.title, rawHtml: r.html,
          rawText: r.text || htmlToText(r.html),
          checksum: computeChecksum(r.text || htmlToText(r.html)),
        });
      }
    }
    await pw.closeBrowser();
  } catch {
    // Fallback to static fetch
    for (const url of allUrls) {
      try {
        const page = await fetchPage(url);
        if (page.ok) {
          const text = htmlToText(page.html);
          documents.push({
            sourceUrl: url, sourceHost: new URL(url).host,
            title: extractTitle(page.html), rawHtml: page.html,
            rawText: text, checksum: computeChecksum(text),
          });
        }
      } catch {}
    }
  }
  console.log(`  Fetched: ${documents.length} (${usePlaywright ? 'Playwright' : 'static fetch'})`);

  // ── STEP 3: Change detection ──
  console.log('[3/5] DETECTING CHANGES...');
  const { changes, currentChecksums } = detectChanges(documents, previousChecksums);
  saveChecksums(currentChecksums);
  logChanges(changes, runId);

  const toProcess = documents.filter(d =>
    changes.new.some(c => c.url === d.sourceUrl) ||
    changes.changed.some(c => c.url === d.sourceUrl)
  );

  console.log(`  New pages: ${changes.new.length}`);
  console.log(`  Changed pages: ${changes.changed.length}`);
  console.log(`  Unchanged (skipped): ${changes.unchanged.length}`);
  console.log(`  To process: ${toProcess.length}`);

  if (toProcess.length === 0) {
    console.log('\n✅ No changes detected. Nothing to process.');
    writeRunReport(runId, { tier, changes, candidates: 0, normalized: 0, aiExtracted: 0 });
    return;
  }

  // ── STEP 4: Extract candidates ──
  console.log('[4/5] EXTRACTING CANDIDATES...');
  const candidates = [];
  for (const doc of toProcess) {
    let extracted = null;
    if (doc.sourceHost?.includes('myscheme.gov.in')) {
      extracted = extractMySchemeRendered({ url: doc.sourceUrl, text: doc.rawText, html: doc.rawHtml, title: doc.title });
    } else if (doc.sourceHost?.endsWith('.gov.in') || doc.sourceHost?.includes('.nic.in')) {
      extracted = extractGenericGovPage({ url: doc.sourceUrl, text: doc.rawText, html: doc.rawHtml, stateCode: /chhattisgarh|cg/i.test(doc.sourceUrl) ? 'CG' : null });
    }
    if (extracted?.schemeName) candidates.push(extracted);
  }
  console.log(`  Candidates: ${candidates.length}`);

  // ── STEP 4b: AI rule extraction (if enabled) ──
  let aiResults = [];
  if (useAI && aiKey && candidates.length > 0) {
    console.log('[4b] AI RULE EXTRACTION...');
    const { batchExtractRules } = await import('../ai/rule-extractor.js');
    aiResults = await batchExtractRules(candidates, aiKey, { delayMs: 1500 });
    
    // Merge AI rules into candidates
    for (const r of aiResults) {
      if (r.extracted?.rules) {
        r.candidate.aiRules = r.extracted.rules;
        r.candidate.aiExclusions = r.extracted.exclusions || [];
        r.candidate.aiNeedCategory = r.extracted.needCategory;
        r.candidate.aiConfidence = r.extracted.confidence;
        r.candidate.aiDocuments = r.extracted.documentsRequired;
      }
    }
    console.log(`  AI extracted: ${aiResults.filter(r => r.extracted).length}/${candidates.length}`);
  }

  // ── STEP 5: Normalize + output ──
  console.log('[5/5] NORMALIZING...');
  const normalized = normalizeAndDedupe(candidates);
  console.log(`  Normalized: ${normalized.length} schemes`);

  // Write output
  fs.mkdirSync('output', { recursive: true });
  
  const output = {
    runId,
    timestamp: new Date().toISOString(),
    tier,
    stats: {
      urlsDiscovered: allUrls.length,
      pagesFetched: documents.length,
      newPages: changes.new.length,
      changedPages: changes.changed.length,
      unchangedPages: changes.unchanged.length,
      candidatesExtracted: candidates.length,
      aiRulesExtracted: aiResults.filter(r => r.extracted).length,
      schemesNormalized: normalized.length,
    },
    changes: {
      new: changes.new,
      changed: changes.changed,
      removed: changes.removed,
    },
    schemes: normalized.map(n => {
      const scheme = n.normalized;
      // If AI provided rules, attach them as suggestions
      if (n.candidate.aiRules) {
        scheme.aiSuggestedRules = n.candidate.aiRules;
        scheme.aiSuggestedExclusions = n.candidate.aiExclusions;
        scheme.aiSuggestedCategory = n.candidate.aiNeedCategory;
        scheme.aiConfidence = n.candidate.aiConfidence;
        scheme.requiresReview = true;
      }
      return scheme;
    }),
  };

  fs.writeFileSync(`output/${runId}.json`, JSON.stringify(output, null, 2), 'utf-8');
  fs.writeFileSync('output/latest-run.json', JSON.stringify(output, null, 2), 'utf-8');

  writeRunReport(runId, output.stats);

  console.log(`\n=== RUN COMPLETE: ${runId} ===`);
  console.log(`  Output: output/${runId}.json`);
  console.log(`  Changes: ${changes.new.length} new, ${changes.changed.length} changed`);
  console.log(`  Schemes: ${normalized.length} (${aiResults.filter(r => r.extracted).length} with AI rules)`);
  
  if (changes.new.length > 0 || changes.changed.length > 0) {
    console.log('\n⚠️  NEW/CHANGED SCHEMES DETECTED — review output/latest-run.json');
    console.log('   Then merge approved schemes into packages/scheme-registry/src/data/schemes.json');
  }
}

function writeRunReport(runId, stats) {
  fs.mkdirSync('output/reports', { recursive: true });
  const report = {
    runId,
    timestamp: new Date().toISOString(),
    ...stats,
  };
  
  // Append to run history
  let history = [];
  try { history = JSON.parse(fs.readFileSync('output/reports/history.json', 'utf-8')); } catch {}
  history.push(report);
  // Keep last 90 days
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  history = history.filter(r => r.timestamp > cutoff);
  fs.writeFileSync('output/reports/history.json', JSON.stringify(history, null, 2), 'utf-8');
}

main().catch(err => {
  console.error('Scheduled run failed:', err);
  process.exit(1);
});
