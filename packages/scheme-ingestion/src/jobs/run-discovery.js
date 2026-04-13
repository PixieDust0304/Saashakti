import { centralSeeds } from '../seeds/central.js';
import { chhattisgarhSeeds } from '../seeds/chhattisgarh.js';
import { discoverFromSeed } from '../crawler/discover.js';

export async function runDiscovery() {
  const seeds = [...centralSeeds, ...chhattisgarhSeeds];
  const results = [];
  for (const seed of seeds) {
    try {
      const result = await discoverFromSeed(seed);
      results.push(result);
    } catch (err) {
      results.push({ seed, discovered: [], error: err.message });
    }
  }
  return results;
}
