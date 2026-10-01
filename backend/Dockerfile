# ==============================================================================
# Multi-Stage Production Dockerfile for Secure Asset Exchange Backend
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependency Installation & Optimization
# ------------------------------------------------------------------------------
FROM node:22-alpine AS dependencies

WORKDIR /usr/src/app

# Install security updates
RUN apk update && apk upgrade --no-cache

# Copy package descriptors
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# ------------------------------------------------------------------------------
# Stage 2: Minimal Production Runtime
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Install security patches & dumb-init for proper PID 1 signal forwarding
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache dumb-init

# Copy production node_modules from dependencies stage
COPY --from=dependencies --chown=node:node /usr/src/app/node_modules ./node_modules

# Copy application source code
COPY --chown=node:node package.json ./
COPY --chown=node:node src/ ./src/

# Use unprivileged non-root user
USER node

# Expose internal API port
EXPOSE 5000

# Native Node container healthcheck against liveness endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 5000) + '/api/v1/health/live').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Use dumb-init to handle SIGINT/SIGTERM gracefully
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
