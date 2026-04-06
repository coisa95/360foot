# syntax=docker/dockerfile:1.7

# ============================================================================
# 360 Foot — CRON Worker (node-cron + triggers HTTP)
# Image finale ~120 MB
# ============================================================================

# ───── Stage 1 : builder ────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* tsconfig.json ./
RUN npm ci --no-audit --no-fund

COPY src ./src
RUN npx tsc

# ───── Stage 2 : runner ─────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Europe/Paris

RUN apk add --no-cache tzdata \
 && cp /usr/share/zoneinfo/Europe/Paris /etc/localtime \
 && echo "Europe/Paris" > /etc/timezone \
 && addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 worker

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund \
 && npm cache clean --force

COPY --from=builder --chown=worker:nodejs /app/dist ./dist

USER worker

# Pas de port exposé : c'est un worker, pas un serveur
CMD ["node", "dist/index.js"]
