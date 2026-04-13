# syntax=docker/dockerfile:1.7

# Multi-stage build for the Saashakti API (Fastify + TypeScript).
# Build context must be the monorepo root so workspace packages are visible:
#
#   docker build -f apps/api/Dockerfile -t saashakti/api:local .

ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

# ----- deps + build stage -----
FROM base AS builder
WORKDIR /workspace

# Copy lockfile + workspace manifests first for cacheable dep install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/admin-web/package.json ./apps/admin-web/package.json
COPY apps/mobile/package.json ./apps/mobile/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/scheme-engine/package.json ./packages/scheme-engine/package.json
COPY packages/scheme-registry/package.json ./packages/scheme-registry/package.json
COPY packages/scheme-ingestion/package.json ./packages/scheme-ingestion/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json

RUN pnpm install --frozen-lockfile

# Copy sources and build
COPY apps/api ./apps/api
COPY packages/types ./packages/types
COPY packages/scheme-engine ./packages/scheme-engine
COPY packages/scheme-registry ./packages/scheme-registry
COPY packages/scheme-ingestion ./packages/scheme-ingestion
COPY packages/api-client ./packages/api-client
COPY infra/sql ./infra/sql

RUN pnpm --filter api build

# ----- runtime stage -----
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001 \
    MIGRATIONS_DIR=/app/infra/sql

# Run as a non-root user
RUN addgroup -S saashakti && adduser -S saashakti -G saashakti

# Copy the built workspace verbatim so pnpm's node_modules symlink
# graph stays intact. Dev deps are included — acceptable for now;
# trim in a follow-up once pnpm deploy lands in the lockfile config.
COPY --from=builder --chown=saashakti:saashakti /workspace /app

USER saashakti
WORKDIR /app/apps/api

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]
