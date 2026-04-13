export type Json = unknown;

export const runDiscovery: () => Promise<Array<{ seed: string; discovered?: string[] }>>;
export const runFetch: (urls: string[]) => Promise<Array<{
  sourceUrl: string;
  httpStatus?: number;
  title?: string;
  rawText?: string;
  rawHtml?: string;
  checksum?: string;
}>>;
export const runExtract: (documents: Json[]) => Promise<Json[]>;
export const runNormalize: (candidates: Json[]) => Promise<Json[]>;
export const runPublish: (items: Json[], repo: { save(s: Json): Promise<Json> }) => Promise<Json[]>;

export class SourceDocRepo {
  constructor(sql: unknown);
  save(doc: Json): Promise<Json>;
}

export class CandidateRepo {
  constructor(sql: unknown);
  save(candidate: Json): Promise<Json>;
}

export class CanonicalRepo {
  constructor(sql: unknown);
  save(scheme: Json): Promise<Json>;
}

export const discoverSchemeSlugs: (...args: unknown[]) => Promise<string[]>;
export const filterWomenRelevantSlugs: (slugs: string[]) => string[];
export const extractMySchemeRendered: (input: { url: string; text: string; html?: string; title?: string }) => Json | null;
export const normalizeAndDedupe: (...args: unknown[]) => Json[];
export const normalizeCandidate: (...args: unknown[]) => Json;
export const suggestRulesFromText: (
  text: string,
  ...args: unknown[]
) => Array<{ field: string; operator: string; value?: unknown }>;
export const extractBenefitAmount: (text: string) => {
  amount?: number;
  frequency?: string;
  annualValue?: number;
};
