# syntax=docker/dockerfile:1.7

# ============================================================================
# 360 Foot — OG Image Service (Express + Sharp)
# Image finale ~250 MB (Sharp embarque libvips)
# ============================================================================

# ───── Stage 1 : builder ────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Sharp a besoin de libc6-compat sur Alpine
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* tsconfig.json ./
RUN npm ci --no-audit --no-fund

COPY src ./src
RUN npx tsc

# ───── Stage 2 : runner ─────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN apk add --no-cache libc6-compat \
 && addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 og

# Copier seulement le nécessaire pour la prod
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund \
 && npm cache clean --force

COPY --from=builder --chown=og:nodejs /app/dist ./dist

USER og

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
