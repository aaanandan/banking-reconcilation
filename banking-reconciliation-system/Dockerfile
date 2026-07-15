# Multi-stage Dockerfile for NestJS Backend Services
# This Dockerfile can build any of the 23 microservices
# Usage: docker build --build-arg SERVICE_NAME=auth-service -t banking-auth-service .

FROM node:18-alpine AS base

# Install dependencies for building
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# ═══════════════════════════════════════════════════════════════════════════
# STAGE 1: Install dependencies
# ═══════════════════════════════════════════════════════════════════════════

FROM base AS dependencies

# Install ALL dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY libs ./libs
COPY apps ./apps

# ═══════════════════════════════════════════════════════════════════════════
# STAGE 2: Build the application
# ═══════════════════════════════════════════════════════════════════════════

FROM dependencies AS build

ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}

# Build shared library first
RUN npm run build:shared

# Build the specific service.
# NOTE: this deliberately does NOT use `npm run build:<alias>` - package.json
# only defines short aliases for some services (build:data-prep, build:orchestrator,
# etc.) and is missing them entirely for others (auth-service, learning-service,
# question-manager-service), which would make `docker build --build-arg
# SERVICE_NAME=auth-service` fail with "Missing script: build:auth-service".
# Calling `nest build` directly with the exact folder name (which always matches
# the project key in nest-cli.json) works for every service unconditionally.
RUN npx nest build ${SERVICE_NAME}

# ═══════════════════════════════════════════════════════════════════════════
# STAGE 3: Production image
# ═══════════════════════════════════════════════════════════════════════════

FROM node:18-alpine AS production

ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}
ENV NODE_ENV=production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port (will be overridden by docker-compose)
EXPOSE 3000

# Health check
# NOTE: services in this monorepo use inconsistent port env var names
# (AUTH_SERVICE_PORT, DATA_PREP_SERVICE_PORT, ORCHESTRATOR_PORT, plain PORT, or
# nothing at all - see HANDOVER_GUIDE.md "Known Port Issues" table). Rather than
# guessing per service, docker-compose.full.yml sets a uniform HEALTH_CHECK_PORT
# for each service it wants health-checked, and this does a plain TCP connect
# (not an HTTP path) since several services have no public unauthenticated
# health route (e.g. auth-service's only /health route requires JWT+AdminGuard).
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const net=require('net');const s=net.connect(process.env.HEALTH_CHECK_PORT||0,'localhost');s.on('connect',()=>{s.end();process.exit(0)});s.on('error',()=>process.exit(1))"

# Start the service
CMD node dist/apps/${SERVICE_NAME}/main.js
