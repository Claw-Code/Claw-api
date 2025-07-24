FROM node:20-alpine AS base

# Install system dependencies
RUN apk update && apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    bash \
    build-base

WORKDIR /app

# Development stage
FROM base AS development

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps && \
    npm rebuild bcrypt --build-from-source && \
    npm cache clean --force

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Production stage
FROM base AS production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --legacy-peer-deps && \
    npm rebuild bcrypt --build-from-source && \
    npm cache clean --force

# Copy built application
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S clawuser -u 1001

# Change ownership
RUN chown -R clawuser:nodejs /app
USER clawuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

# Start the application
CMD ["npm", "start"]

# Default to development stage
FROM development AS default
CMD ["npm", "run", "dev"]
