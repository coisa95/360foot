# syntax=docker/dockerfile:1.7

# ============================================================================
# 360 Foot — Next.js 14 production image (standalone, multi-stage)
# Image finale ~180 MB
# ============================================================================

# ───── Stage 1 : deps ───────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Installer toutes les dépendances (incluant devDependencies pour le build)
# --include=dev force l'installation même si NODE_ENV=production est passé en build arg
COPY package.json package-lock.json* ./
RUN npm ci --include=dev --no-audit --no-fund

# ───── Stage 2 : builder ────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Variables NEXT_PUBLIC_* doivent être présentes au build (inlinées dans le JS)
# Coolify les injecte via build args
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# ───── Stage 3 : runner (image finale légère) ───────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# User non-root pour sécurité
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# libvips runtime requis par sharp (AVIF/WebP optimisation côté serveur).
# Sans ça, next/image fallback en PNG/JPEG = images 5x plus lourdes.
RUN apk add --no-cache vips-cpp

# Copier uniquement les artefacts standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Sharp n'est pas bundlé par output:standalone — le copier explicitement.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@img ./node_modules/@img

USER nextjs

EXPOSE 3000

# Healthcheck Coolify
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
