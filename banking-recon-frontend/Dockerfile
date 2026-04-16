# Multi-stage Dockerfile for React Frontend
# Builds a production-optimized frontend served by Nginx

# ═══════════════════════════════════════════════════════════════════════════
# STAGE 1: Build the React application
# ═══════════════════════════════════════════════════════════════════════════

FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_BASE_URL=http://localhost:3001
ARG VITE_AUTH_SERVICE_URL=http://localhost:3001/api/auth
ARG VITE_DATA_PREP_URL=http://localhost:3003/api
ARG VITE_ORCHESTRATOR_URL=http://localhost:3004/api

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_AUTH_SERVICE_URL=$VITE_AUTH_SERVICE_URL
ENV VITE_DATA_PREP_URL=$VITE_DATA_PREP_URL
ENV VITE_ORCHESTRATOR_URL=$VITE_ORCHESTRATOR_URL

# Build the application
RUN npm run build

# ═══════════════════════════════════════════════════════════════════════════
# STAGE 2: Production image with Nginx
# ═══════════════════════════════════════════════════════════════════════════

FROM nginx:1.25-alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Create health endpoint
RUN echo '{"status":"ok"}' > /usr/share/nginx/html/health

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

# ═══════════════════════════════════════════════════════════════════════════
# STAGE 3: Development image (optional)
# ═══════════════════════════════════════════════════════════════════════════

FROM node:18-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
