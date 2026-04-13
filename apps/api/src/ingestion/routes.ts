import type { FastifyInstance } from 'fastify';
import { sql } from '../db/client.js';

const loadIngestion = async () => {
  const mod = await import('../../../../packages/scheme-ingestion/src/index.js');
  return mod;
};

const loadCanonicalRepo = async () => {
  const { CanonicalRepo } = await import('../../../../packages/scheme-ingestion/src/persistence/canonical-repo.js');
  return new CanonicalRepo(sql);
};

const loadSourceDocRepo = async () => {
  const { SourceDocRepo } = await import('../../../../packages/scheme-ingestion/src/persistence/source-doc-repo.js');
  return new SourceDocRepo(sql);
};

const loadCandidateRepo = async () => {
  const { CandidateRepo } = await import('../../../../packages/scheme-ingestion/src/persistence/candidate-repo.js');
  return new CandidateRepo(sql);
};

export async function ingestionRoutes(app: FastifyInstance) {

  app.post('/v1/ingestion/discover', async (_req, reply) => {
    const { runDiscovery } = await loadIngestion();
    const results = await runDiscovery();
    const total = results.reduce((s: number, r: any) => s + (r.discovered?.length || 0), 0);
    reply.send({ seeds: results.length, totalUrlsDiscovered: total, results });
  });

  app.post<{ Body: { urls: string[] } }>('/v1/ingestion/fetch', async (req, reply) => {
    const urls = req.body?.urls || [];
    if (!Array.isArray(urls) || urls.length === 0) return reply.status(400).send({ error: 'urls array required' });
    if (urls.length > 20) return reply.status(400).send({ error: 'max 20 urls per request' });
    const { runFetch } = await loadIngestion();
    const results = await runFetch(urls);
    const repo = await loadSourceDocRepo();
    for (const doc of results) { try { await repo.save(doc); } catch {} }
    reply.send({ fetched: results.length, results: results.map((r: any) => ({
      sourceUrl: r.sourceUrl, httpStatus: r.httpStatus, title: r.title, textLength: r.rawText?.length || 0, checksum: r.checksum,
    }))});
  });

  app.post<{ Body: { documents: any[] } }>('/v1/ingestion/extract', async (req, reply) => {
    const docs = req.body?.documents || [];
    const { runExtract } = await loadIngestion();
    const candidates = await runExtract(docs);
    const repo = await loadCandidateRepo();
    for (const c of candidates) { try { await repo.save(c); } catch {} }
    reply.send({ extracted: candidates.length, candidates });
  });

  app.post<{ Body: { candidates: any[] } }>('/v1/ingestion/normalize', async (req, reply) => {
    const candidates = req.body?.candidates || [];
    const { runNormalize } = await loadIngestion();
    const results = await runNormalize(candidates);
    reply.send({ normalized: results.length, results });
  });

  app.post<{ Body: { items: any[] } }>('/v1/ingestion/publish', async (req, reply) => {
    const items = req.body?.items || [];
    const { runPublish } = await loadIngestion();
    const repo = await loadCanonicalRepo();
    const published = await runPublish(items, repo);
    reply.send({ published: published.length, results: published });
  });

  app.post('/v1/ingestion/run-full', async (_req, reply) => {
    const ingestion = await loadIngestion();
    const discovered = await ingestion.runDiscovery();
    const allUrls = discovered.flatMap((r: any) => r.discovered || []).slice(0, 50);
    const fetched = await ingestion.runFetch(allUrls);
    const candidates = await ingestion.runExtract(fetched);
    const normalized = await ingestion.runNormalize(candidates);
    const repo = await loadCanonicalRepo();
    const published = await ingestion.runPublish(normalized, repo);
    reply.send({
      pipeline: 'complete',
      stats: { seedsCrawled: discovered.length, urlsDiscovered: allUrls.length, pagesFetched: fetched.length, candidatesExtracted: candidates.length, schemesNormalized: normalized.length, schemesPublished: published.length },
    });
  });

  app.get('/v1/ingestion/stats', async (_req, reply) => {
    const [sources] = await sql`SELECT count(*)::int as total FROM scheme_source_documents`.catch(() => [{ total: 0 }]);
    const [candidates] = await sql`SELECT count(*)::int as total FROM scheme_candidates`.catch(() => [{ total: 0 }]);
    const [canonicals] = await sql`SELECT count(*)::int as total FROM canonical_schemes`.catch(() => [{ total: 0 }]);
    const [published] = await sql`SELECT count(*)::int as total FROM canonical_schemes WHERE is_published = true`.catch(() => [{ total: 0 }]);
    reply.send({
      sourceDocuments: (sources as any)?.total || 0,
      candidates: (candidates as any)?.total || 0,
      canonicalSchemes: (canonicals as any)?.total || 0,
      publishedSchemes: (published as any)?.total || 0,
    });
  });
}
