# ==============================================================================
# Multi-Stage Production Dockerfile for Secure Asset Exchange Frontend SPA
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Static Assets
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Build arguments for Vite compilation
ARG VITE_API_URL=/api/v1
ARG VITE_WS_URL=/

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

# Copy dependency manifests
COPY package*.json ./

# Clean installation of dependencies
RUN npm ci

# Copy application sources
COPY . .

# Compile optimized static bundle
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Nginx Web Server for High-Performance Static Serving
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Remove default nginx html files
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA bundle from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
