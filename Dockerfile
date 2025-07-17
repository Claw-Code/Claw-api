# Multi-stage build for local development and testing
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    curl \
    bash \
    gnupg \
    supervisor \
    mongodb-org-tools \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Development stage with MongoDB
FROM base AS development

# Install MongoDB
RUN apk add --no-cache mongodb mongodb-tools

# Create MongoDB data directory
RUN mkdir -p /data/db /var/log/mongodb
RUN chown -R mongodb:mongodb /data/db /var/log/mongodb

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

# Start MongoDB in background
echo "📦 Starting MongoDB..."
mongod --fork --logpath /var/log/mongodb/mongod.log --dbpath /data/db --bind_ip 0.0.0.0

# Wait for MongoDB to start
sleep 5

# Initialize MongoDB
echo "🔧 Initializing MongoDB..."
mongo v0_clone --eval "
db.createCollection('users');
db.createCollection('chats');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 });
db.chats.createIndex({ userId: 1 });
db.chats.createIndex({ createdAt: 1 });
print('Database initialized successfully!');
"

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
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

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
