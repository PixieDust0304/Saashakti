
import { centralSeeds } from '../seeds/central.js';
import { chhattisgarhSeeds } from '../seeds/chhattisgarh.js';
import { discoverFromSeed } from '../crawler/discover.js';
import { discoverSchemeSlugs, filterWomenRelevantSlugs } from '../sources/myscheme-api.js';
import fs from 'node:fs';

async function main() {
  console.log('=== SCHEME URL DISCOVERY ===\n');
  const results = { myscheme: [], seeds: [] };

  // myScheme sitemap
  try {
    const slugs = await discoverSchemeSlugs();
    const women = filterWomenRelevantSlugs(slugs);
    results.myscheme = { total: slugs.length, womenRelevant: women.length, slugs: women.slice(0, 50) };
    console.log(`myScheme: ${slugs.length} total, ${women.length} women-relevant`);
  } catch (err) {
    console.log(`myScheme: failed — ${err.message}`);
  }

  // Seed crawl
  const seeds = [...centralSeeds, ...chhattisgarhSeeds];
  for (const seed of seeds) {
    try {
      const r = await discoverFromSeed(seed);
      results.seeds.push({ seed: seed.url, discovered: r.discovered?.length || 0, urls: r.discovered?.slice(0, 10) });
      console.log(`${seed.url}: ${r.discovered?.length || 0} URLs`);
    } catch (err) {
      results.seeds.push({ seed: seed.url, discovered: 0, error: err.message });
      console.log(`${seed.url}: failed`);
    }
  }

  fs.mkdirSync('output', { recursive: true });
  fs.writeFileSync('output/discovery-results.json', JSON.stringify(results, null, 2));
  console.log('\n✅ Results: output/discovery-results.json');
}

main().catch(console.error);
