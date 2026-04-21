
/**
 * Change detection for scheme source pages
 * Compares checksums between fetches to detect modifications
 */

import crypto from 'node:crypto';
import fs from 'node:fs';

const CHANGELOG_DIR = 'data/changelog';
const CHECKSUM_FILE = 'data/checksums.json';

/**
 * Load previous checksums
 */
export function loadChecksums() {
  try {
    if (fs.existsSync(CHECKSUM_FILE)) {
      return JSON.parse(fs.readFileSync(CHECKSUM_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

/**
 * Save current checksums
 */
export function saveChecksums(checksums) {
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync(CHECKSUM_FILE, JSON.stringify(checksums, null, 2), 'utf-8');
}

/**
 * Compute checksum for text content
 */
export function computeChecksum(text) {
  return crypto.createHash('sha256').update(text || '').digest('hex');
}

/**
 * Detect changes between old and new fetch results
 * Returns: { new: [], changed: [], unchanged: [], removed: [] }
 */
export function detectChanges(fetchResults, previousChecksums) {
  const changes = { new: [], changed: [], unchanged: [], removed: [] };
  const currentChecksums = {};

  for (const result of fetchResults) {
    const url = result.sourceUrl || result.url;
    const checksum = result.checksum || computeChecksum(result.rawText || result.text || '');
    currentChecksums[url] = checksum;

    const previous = previousChecksums[url];

    if (!previous) {
      changes.new.push({ url, checksum, title: result.title });
    } else if (previous !== checksum) {
      changes.changed.push({ url, oldChecksum: previous, newChecksum: checksum, title: result.title });
    } else {
      changes.unchanged.push({ url });
    }
  }

  // Detect removed URLs
  for (const url of Object.keys(previousChecksums)) {
    if (!currentChecksums[url]) {
      changes.removed.push({ url });
    }
  }

  return { changes, currentChecksums };
}

/**
 * Log changes to changelog file
 */
export function logChanges(changes, runId) {
  fs.mkdirSync(CHANGELOG_DIR, { recursive: true });
  
  const entry = {
    runId,
    timestamp: new Date().toISOString(),
    summary: {
      new: changes.new.length,
      changed: changes.changed.length,
      unchanged: changes.unchanged.length,
      removed: changes.removed.length,
    },
    details: changes,
  };

  const logPath = `${CHANGELOG_DIR}/${runId}.json`;
  fs.writeFileSync(logPath, JSON.stringify(entry, null, 2), 'utf-8');
  
  console.log(`[changelog] New: ${changes.new.length}, Changed: ${changes.changed.length}, Unchanged: ${changes.unchanged.length}, Removed: ${changes.removed.length}`);
  
  return entry;
}
