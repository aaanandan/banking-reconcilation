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

# Build the specific service
RUN npm run build:${SERVICE_NAME}

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
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+process.env.PORT+'/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the service
CMD node dist/apps/${SERVICE_NAME}/main.js
