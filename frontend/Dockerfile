# 🔱 Vedic Ghaḍī — Cloud Run image · Next.js 16 standalone
# Multi-stage build: deps → build → run. Final image ~120MB (alpine + node22).
#
# Build from repo root with:
#   gcloud run deploy vedic-ghadi --source ./frontend --region asia-south1
# or locally:
#   docker build -f frontend/Dockerfile -t vedic-ghadi ./frontend && docker run -p 8080:8080 vedic-ghadi

# ─── deps stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# ─── build stage ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── runtime stage ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Cloud Run injects PORT (default 8080); Next.js standalone honors PORT via process.env.
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Non-root for Cloud Run best practice
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output (server.js + bundled node_modules minimal set)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
