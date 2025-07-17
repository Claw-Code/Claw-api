# Use Node.js 18 on Debian (has better package support than Alpine)
FROM node:18-bullseye AS base

# Install system dependencies for Debian
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    curl \
    bash \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Development stage (MongoDB will be separate container)
FROM base AS development

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Create workspace directory
RUN mkdir -p workspace/downloads logs

# Create startup script for development
RUN cat > /app/start-dev.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting Claw API in development mode..."

# Wait for MongoDB to be available
echo "⏳ Waiting for MongoDB to be ready..."
while ! curl -s mongodb:27017 > /dev/null; do
  echo "Waiting for MongoDB..."
  sleep 2
done

echo "✅ MongoDB is ready!"

# Start the application
echo "🌟 Starting API server..."
if [ "$NODE_ENV" = "production" ]; then
    npm run build
    npm start
else
    npm run dev
fi
EOF

RUN chmod +x /app/start-dev.sh

# Production stage
FROM base AS production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application
COPY . .

# Build the application
RUN npm run build

# Create workspace directory
RUN mkdir -p workspace/downloads logs

# Create non-root user
RUN groupadd -g 1001 nodejs
RUN useradd -r -u 1001 -g nodejs nextjs

# Change ownership
RUN chown -R nextjs:nodejs workspace logs

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["npm", "start"]

# Default to development stage
FROM development AS default
CMD ["/app/start-dev.sh"]
