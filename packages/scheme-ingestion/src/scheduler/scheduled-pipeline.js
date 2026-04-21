import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { discoverSchemeSlugs, schemeSlugToUrl, filterWomenRelevantSlugs } from "../sources/myscheme-api.js";
import { centralSeeds } from "../seeds/central.js";
import { chhattisgarhSeeds } from "../seeds/chhattisgarh.js";
import { fetchPage } from "../crawler/fetch.js";
import { htmlToText, extractTitle } from "../crawler/text-extract.js";
import { extractMySchemeRendered } from "../extractors/myscheme-rendered.js";
import { extractGenericGovPage } from "../extractors/generic-gov.js";
import { normalizeAndDedupe } from "../normalize/enhanced-normalizer.js";
import { discoverFromSeed } from "../crawler/discover.js";

const CHECKSUM_FILE = path.resolve("data/checksums.json");
const CHANGES_FILE = path.resolve("data/changes-log.json");
const CANDIDATES_FILE = path.resolve("data/pending-candidates.json");

function loadChecksums() {
  try { return JSON.parse(fs.readFileSync(CHECKSUM_FILE, "utf-8")); }
  catch { return {}; }
}

function saveChecksums(checksums) {
  fs.mkdirSync(path.dirname(CHECKSUM_FILE), { recursive: true });
  fs.writeFileSync(CHECKSUM_FILE, JSON.stringify(checksums, null, 2));
}

function appendChangeLog(entry) {
  let log = [];
  try { log = JSON.parse(fs.readFileSync(CHANGES_FILE, "utf-8")); } catch {}
  log.push(entry);
  // Keep last 500 entries
  if (log.length > 500) log = log.slice(-500);
  fs.mkdirSync(path.dirname(CHANGES_FILE), { recursive: true });
  fs.writeFileSync(CHANGES_FILE, JSON.stringify(log, null, 2));
}

function savePendingCandidates(candidates) {
  fs.mkdirSync(path.dirname(CANDIDATES_FILE), { recursive: true });
  const existing = [];
  try { existing.push(...JSON.parse(fs.readFileSync(CANDIDATES_FILE, "utf-8"))); } catch {}
  existing.push(...candidates);
  fs.writeFileSync(CANDIDATES_FILE, JSON.stringify(existing, null, 2));
}

/**
 * Run the scheduled ingestion pipeline:
 * 1. Discover URLs from seeds + myScheme sitemap
 * 2. Fetch each URL
 * 3. Compare checksum to last known — skip if unchanged
 * 4. Extract scheme data from changed pages only
 * 5. Normalize + dedupe
 * 6. Save as pending candidates for human review
 * 7. Log all changes
 */
export async function runScheduledIngestion(options = {}) {
  const { forceRefresh = false } = options;
  const checksums = forceRefresh ? {} : loadChecksums();
  const runId = new Date().toISOString().replace(/[:.]/g, "-");

  const stats = {
    runId,
    startedAt: new Date().toISOString(),
    urlsDiscovered: 0,
    urlsFetched: 0,
    urlsUnchanged: 0,
    urlsChanged: 0,
    urlsFailed: 0,
    candidatesExtracted: 0,
    candidatesNormalized: 0,
    newSchemes: [],
    changedSchemes: [],
  };

  console.log("[1/5] Discovering URLs...");

  // Gather all URLs
  let allUrls = [];

  // myScheme sitemap
  try {
    const slugs = await discoverSchemeSlugs();
    const women = filterWomenRelevantSlugs(slugs);
    allUrls.push(...women.map(schemeSlugToUrl));
    console.log(`  myScheme: ${slugs.length} total, ${women.length} women-relevant`);
  } catch (err) {
    console.log(`  myScheme sitemap: ${err.message}`);
  }

  // Seed crawl
  const seeds = [...centralSeeds, ...chhattisgarhSeeds];
  for (const seed of seeds) {
    try {
      const r = await discoverFromSeed(seed);
      allUrls.push(...(r.discovered || []));
    } catch {}
  }

  allUrls = [...new Set(allUrls)];
  stats.urlsDiscovered = allUrls.length;
  console.log(`  Total unique URLs: ${allUrls.length}`);

  // Fetch + change detection
  console.log("[2/5] Fetching with change detection...");
  const changedDocs = [];

  for (const url of allUrls) {
    try {
      const page = await fetchPage(url, 20000);
      stats.urlsFetched++;

      if (!page.ok) {
        stats.urlsFailed++;
        continue;
      }

      const rawText = htmlToText(page.html);
      const newChecksum = crypto.createHash("sha256").update(rawText).digest("hex");
      const oldChecksum = checksums[url];

      if (oldChecksum === newChecksum && !forceRefresh) {
        stats.urlsUnchanged++;
        continue;
      }

      const changeType = oldChecksum ? "modified" : "new";
      stats.urlsChanged++;

      checksums[url] = newChecksum;

      changedDocs.push({
        sourceUrl: url,
        sourceHost: new URL(url).host,
        sourceType: url.includes("myscheme") ? "myscheme" : "generic_gov",
        title: extractTitle(page.html),
        rawHtml: page.html,
        rawText,
        checksum: newChecksum,
        changeType,
        previousChecksum: oldChecksum || null,
        fetchedAt: new Date().toISOString(),
      });

      if (changeType === "new") {
        console.log(`  🆕 NEW: ${url}`);
      } else {
        console.log(`  🔄 CHANGED: ${url}`);
      }
    } catch (err) {
      stats.urlsFailed++;
    }

    // Rate limiting: 1 second between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  saveChecksums(checksums);
  console.log(`  Changed: ${stats.urlsChanged}, Unchanged: ${stats.urlsUnchanged}, Failed: ${stats.urlsFailed}`);

  if (changedDocs.length === 0) {
    console.log("[3-5] No changes detected. Skipping extraction.");
    stats.completedAt = new Date().toISOString();
    appendChangeLog({ ...stats, result: "no_changes" });
    return { summary: stats };
  }

  // Extract
  console.log("[3/5] Extracting from changed pages...");
  const candidates = [];
  for (const doc of changedDocs) {
    let extracted = null;
    if (doc.sourceHost.includes("myscheme.gov.in")) {
      extracted = extractMySchemeRendered({ url: doc.sourceUrl, text: doc.rawText, html: doc.rawHtml, title: doc.title });
    } else if (doc.sourceHost.endsWith(".gov.in") || doc.sourceHost.includes(".nic.in")) {
      extracted = extractGenericGovPage({ url: doc.sourceUrl, text: doc.rawText, html: doc.rawHtml, stateCode: /chhattisgarh|cg/i.test(doc.sourceUrl) ? "CG" : null, authority: "state" });
    }
    if (extracted && extracted.schemeName) {
      extracted._changeType = doc.changeType;
      extracted._fetchedAt = doc.fetchedAt;
      candidates.push(extracted);
    }
  }
  stats.candidatesExtracted = candidates.length;
  console.log(`  Extracted: ${candidates.length} candidates`);

  // Normalize
  console.log("[4/5] Normalizing...");
  const normalized = normalizeAndDedupe(candidates);
  stats.candidatesNormalized = normalized.length;

  // Classify changes
  for (const n of normalized) {
    const entry = {
      id: n.normalized.id,
      name: n.normalized.nameEn,
      changeType: n.candidate._changeType,
      sourceUrl: n.candidate.sourceUrl,
      rulesCount: n.normalized.rules.length,
      confidence: n.candidate.confidenceScore,
      detectedAt: new Date().toISOString(),
    };
    if (n.candidate._changeType === "new") {
      stats.newSchemes.push(entry);
    } else {
      stats.changedSchemes.push(entry);
    }
  }

  // Save pending candidates for human review
  console.log("[5/5] Saving pending candidates...");
  savePendingCandidates(normalized.map(n => ({
    ...n.normalized,
    _review: {
      status: "pending",
      detectedAt: new Date().toISOString(),
      changeType: n.candidate._changeType,
      sourceUrl: n.candidate.sourceUrl,
      rawEligibilityText: n.candidate.eligibilityText,
      rawBenefitText: n.candidate.benefitSummary,
    },
  })));

  stats.completedAt = new Date().toISOString();
  appendChangeLog({ ...stats, result: "changes_detected" });

  // Summary notification
  if (stats.newSchemes.length > 0 || stats.changedSchemes.length > 0) {
    console.log("\n=== CHANGES DETECTED ===");
    for (const s of stats.newSchemes) {
      console.log(`  🆕 NEW SCHEME: ${s.name} (${s.rulesCount} rules, confidence: ${s.confidence})`);
    }
    for (const s of stats.changedSchemes) {
      console.log(`  🔄 MODIFIED: ${s.name}`);
    }
    console.log(`\n  Review pending candidates at: data/pending-candidates.json`);
  }

  return { summary: stats };
}
