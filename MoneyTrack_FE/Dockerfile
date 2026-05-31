# =============================================================================
# MoneyTrack Frontend — Production Dockerfile
# Tech: Next.js 15 / React 19 / TypeScript / Tailwind CSS / pnpm
# =============================================================================

# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:20-alpine AS deps

# Install pnpm via corepack (ships with Node 20, no extra download needed)
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy lockfiles first to maximise layer cache hits
COPY package.json pnpm-lock.yaml ./

# Install production + dev dependencies (dev needed for the build step)
RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Reuse installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the source
COPY . .

# Build the Next.js application
# NEXT_TELEMETRY_DISABLED=1 prevents telemetry pings during build
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ─── Stage 3: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install curl for HEALTHCHECK
RUN apk add --no-cache curl

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only what Next.js needs to run in standalone mode.
# next.config.mjs does NOT enable output:'standalone', so we copy the full
# .next build output + node_modules (production deps only).
COPY --from=builder --chown=appuser:appgroup /app/public ./public
COPY --from=builder --chown=appuser:appgroup /app/.next ./.next
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json

USER appuser

# ─── Runtime environment variables ───────────────────────────────────────────
# NEXT_PUBLIC_* vars are baked into the JS bundle at build time.
# Server-side vars (e.g. API_URL) can be injected here or at runtime.
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

ENTRYPOINT ["pnpm", "start"]
