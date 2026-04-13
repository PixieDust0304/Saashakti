# @saashakti/scheme-ingestion

Auto-fetch engine for discovering, extracting, and normalizing government scheme data from official sources.

## Architecture

```
discover → fetch → extract → normalize → dedupe → review → publish
```

## Sources

| Source | Type | Method |
|--------|------|--------|
| myScheme.gov.in | Sitemap + pages | Playwright (JS-rendered) |
| india.gov.in | Static HTML | fetch() |
| CG state portals | Static HTML | fetch() |
| CG district portals | Static HTML | fetch() |

## Quick Start

```bash
# Install dependencies
cd packages/scheme-ingestion
npm install
npx playwright install chromium

# Run smoke tests
npm test

# Discover URLs (no Playwright needed)
npm run discover

# Full pipeline with Playwright
npm run pipeline -- --playwright --limit 30 --women-only

# myScheme-specific fetch
npm run fetch-myscheme -- --limit 20 --women-only
```

## Output

Results go to `output/`:
- `ingested-schemes.json` — full pipeline output
- `new-schemes-for-review.json` — merge-ready scheme array
- `myscheme-raw-candidates.json` — raw extracted data
- `myscheme-normalized.json` — normalized schemes

## CLI Options

| Flag | Description |
|------|------------|
| `--playwright` | Use Playwright for JS-rendered sites |
| `--limit N` | Max URLs to process (default: 50) |
| `--women-only` | Filter for women-relevant schemes only |

## Merging into Live Registry

After reviewing `output/new-schemes-for-review.json`:

1. Copy approved schemes
2. Paste into `packages/scheme-registry/src/data/schemes.json`
3. Run tests: `pnpm --filter scheme-registry test`
4. Commit

## Pipeline as API

The ingestion pipeline is also exposed via Fastify at:

```
POST /v1/ingestion/discover
POST /v1/ingestion/fetch
POST /v1/ingestion/extract
POST /v1/ingestion/normalize
POST /v1/ingestion/publish
POST /v1/ingestion/run-full
GET  /v1/ingestion/stats
```
