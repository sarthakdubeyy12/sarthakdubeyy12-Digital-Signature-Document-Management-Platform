# Dockerfile for Node.js application

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema (needed for prisma generate during npm install)
COPY prisma ./prisma

# Install ALL dependencies (including dev dependencies for nodemon)
RUN npm ci

# Production stage
FROM node:18-alpine

# Install dumb-init, wget, and openssl for Prisma
RUN apk add --no-cache dumb-init wget openssl

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy dependencies from builder (including devDependencies for development)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application files
COPY --chown=nodejs:nodejs . .

# Regenerate Prisma client for correct platform
RUN npx prisma generate

# Create directories for storage and logs
RUN mkdir -p storage/documents/original storage/documents/signed storage/signatures storage/temp logs/error logs/combined logs/audit

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command (can be overridden by docker-compose)
CMD ["npm", "run", "dev"]
