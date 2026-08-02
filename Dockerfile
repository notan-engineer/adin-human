# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────────────────
# The Heuman Chef - self-hosted Node SSR image.
#
# Three stages so the runtime layer carries no npm cache, no source, and no dev
# dependencies: deps (npm ci) → builder (next build) → runner (standalone only).
# `output: "standalone"` in next.config.mjs emits `.next/standalone/server.js`
# with just the traced production deps, which is what makes the final image
# small enough to be worth the multi-stage dance.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:22-alpine AS base
# sharp (used by scripts/optimize-images.mjs and Next's image pipeline) needs
# libc compatibility on Alpine's musl.
RUN apk add --no-cache libc6-compat


# ── deps ─────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
# Lockfile-only layer: dependencies are re-resolved only when these change, so
# source edits don't invalidate the (slow) install.
COPY package.json package-lock.json ./
RUN npm ci


# ── builder ──────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Baked into the client bundle at build time, so it must be correct HERE and not
# only at runtime. Override with --build-arg for a real deploy.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:4000
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


# ── runner ───────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=4000

# Non-root. `--chown` on each COPY avoids a second full-size layer from chown -R.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# public/ is NOT included in the standalone output - it has to be copied
# explicitly, or every image, font and icon 404s.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# The standalone server plus its traced node_modules (includes the assets named
# by outputFileTracingIncludes, which the next/og routes read from disk).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Static chunks live outside the standalone bundle too.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 4000

# Hits the real app through the Next router rather than a synthetic endpoint, so
# a process that is up but failing to render is correctly reported unhealthy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
