# ============================================================================
# Multi-stage Dockerfile for Todo Management Platform
# ============================================================================

# ── Stage 1: Install dependencies ──────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production && cp -R node_modules /prod_modules
RUN npm ci

# ── Stage 2: Build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build NestJS application
RUN npm run build

# ── Stage 3: Production ───────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy production dependencies
COPY --from=deps /prod_modules ./node_modules

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/package.json ./package.json

# Generate Prisma Client in production node_modules
RUN npx prisma generate

# Switch to non-root user
USER nestjs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Run migrations and start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]

