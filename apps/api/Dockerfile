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

# pnpm 10's `pnpm deploy` requires injected workspace packages
ENV NPM_CONFIG_INJECT_WORKSPACE_PACKAGES=true

# Copy lockfile + workspace manifest first so dep install is cacheable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/scheme-engine/package.json ./packages/scheme-engine/package.json
COPY packages/scheme-registry/package.json ./packages/scheme-registry/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
COPY apps/admin-web/package.json ./apps/admin-web/package.json
COPY apps/mobile/package.json ./apps/mobile/package.json

RUN pnpm install --frozen-lockfile

# Copy sources and build
COPY apps/api ./apps/api
COPY packages/types ./packages/types
COPY packages/scheme-engine ./packages/scheme-engine
COPY packages/scheme-registry ./packages/scheme-registry
COPY packages/api-client ./packages/api-client
COPY infra/sql ./infra/sql

RUN pnpm --filter api build

# Produce a self-contained deploy bundle under /deploy/api
RUN pnpm deploy --filter api --prod /deploy/api \
 && rm -rf /deploy/api/src /deploy/api/tests /deploy/api/scripts

# ----- runtime stage -----
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001 \
    MIGRATIONS_DIR=/app/infra/sql

# Run as a non-root user
RUN addgroup -S saashakti && adduser -S saashakti -G saashakti

COPY --from=builder --chown=saashakti:saashakti /deploy/api/node_modules ./node_modules
COPY --from=builder --chown=saashakti:saashakti /deploy/api/dist ./dist
COPY --from=builder --chown=saashakti:saashakti /deploy/api/package.json ./package.json
COPY --from=builder --chown=saashakti:saashakti /workspace/infra/sql ./infra/sql

USER saashakti

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]
