# Dockerfile for Node.js application

# =====================================
# Stage 1: Dependencies Builder
# =====================================
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema (needed for prisma generate during npm install)
COPY prisma ./prisma

# Install ALL dependencies (including dev dependencies)
RUN npm ci

# =====================================
# Stage 2: Production Dependencies
# =====================================
FROM node:18-alpine AS prod-dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema
COPY prisma ./prisma

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# =====================================
# Stage 3: Development Image
# =====================================
FROM node:18-alpine AS development

# Install dumb-init, wget, and openssl for Prisma
RUN apk add --no-cache dumb-init wget openssl

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy all dependencies (including dev dependencies for nodemon)
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application files
COPY --chown=nodejs:nodejs . .

# Regenerate Prisma client for correct platform
RUN npx prisma generate

# Create directories for storage and logs
RUN mkdir -p storage/documents/original storage/documents/signed storage/signatures storage/temp logs/error logs/combined logs/audit && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Development command (with hot reload)
CMD ["npm", "run", "dev"]

# =====================================
# Stage 4: Production Image
# =====================================
FROM node:18-alpine AS production

# Install dumb-init, wget, and openssl for Prisma
RUN apk add --no-cache dumb-init wget openssl

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy only production dependencies
COPY --from=prod-dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application files
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs prisma ./prisma
COPY --chown=nodejs:nodejs src ./src

# Regenerate Prisma client for correct platform
RUN npx prisma generate

# Create directories for storage and logs
RUN mkdir -p storage/documents/original storage/documents/signed storage/signatures storage/temp logs/error logs/combined logs/audit && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Production command (no hot reload)
CMD ["node", "src/server.js"]
