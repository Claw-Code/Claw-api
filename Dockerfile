<<<<<<< HEAD
<<<<<<< HEAD
# Fixed production Dockerfile with proper native module handling
FROM node:18-bullseye AS base

# Install system dependencies for native module compilation
=======
# Multi-stage build for local development and testing
FROM ubuntu:22.04
>>>>>>> d07d2a6 (Init API)
=======
# Use Node.js 18 on Debian (has better package support than Alpine)
FROM node:18-bullseye AS base

# Install system dependencies for Debian
>>>>>>> 9ce6ccf (Updated dockerScript)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    curl \
    bash \
<<<<<<< HEAD
<<<<<<< HEAD
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Development stage
FROM base AS development

# Copy package files and .npmrc
COPY package*.json ./
COPY .npmrc ./

# Install dependencies and rebuild native modules
RUN npm install --legacy-peer-deps && \
    npm rebuild bcrypt --build-from-source && \
    npm cache clean --force
=======
    gnupg \
    supervisor \
    mongodb-org-tools \
 && rm -rf /var/lib/apt/lists/*
=======
    && rm -rf /var/lib/apt/lists/*
>>>>>>> 9ce6ccf (Updated dockerScript)

WORKDIR /app

# Development stage (MongoDB will be separate container)
FROM base AS development

# Copy package files
COPY package*.json ./

<<<<<<< HEAD
# Install all dependencies (including dev)
RUN npm install
>>>>>>> d07d2a6 (Init API)
=======
# Install all dependencies with legacy peer deps to avoid conflicts
RUN npm install --legacy-peer-deps
>>>>>>> 19ce577 (convo fix and LLm tune)

# Copy source code
COPY . .

# Create workspace directory
RUN mkdir -p workspace/downloads logs

# Create startup script for development
RUN cat > /app/start-dev.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting Claw API in development mode..."

<<<<<<< HEAD
<<<<<<< HEAD
# Rebuild native modules to ensure compatibility
echo "🔧 Rebuilding native modules..."
npm rebuild bcrypt --build-from-source

=======
>>>>>>> 9ce6ccf (Updated dockerScript)
# Wait for MongoDB to be available
echo "⏳ Waiting for MongoDB to be ready..."
while ! curl -s mongodb:27017 > /dev/null; do
  echo "Waiting for MongoDB..."
  sleep 2
done
<<<<<<< HEAD

echo "✅ MongoDB is ready!"
=======
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
>>>>>>> d07d2a6 (Init API)
=======

echo "✅ MongoDB is ready!"
>>>>>>> 9ce6ccf (Updated dockerScript)

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

<<<<<<< HEAD
# Copy package files and .npmrc
COPY package*.json ./
COPY .npmrc ./

# Install only production dependencies and rebuild native modules
RUN npm ci --only=production --legacy-peer-deps && \
    npm rebuild bcrypt --build-from-source && \
    npm cache clean --force
=======
# Copy package files
COPY package*.json ./

<<<<<<< HEAD
# Install only production dependencies
RUN npm ci --only=production
>>>>>>> d07d2a6 (Init API)
=======
# Install only production dependencies with legacy peer deps
RUN npm ci --only=production --legacy-peer-deps
>>>>>>> 19ce577 (convo fix and LLm tune)

# Copy built application
COPY . .

# Build the application
RUN npm run build

# Create workspace directory
RUN mkdir -p workspace/downloads logs

# Create non-root user
<<<<<<< HEAD
<<<<<<< HEAD
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs clawuser

# Change ownership
RUN chown -R clawuser:nodejs workspace logs

# Switch to non-root user
USER clawuser
=======
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
=======
RUN groupadd -g 1001 nodejs
RUN useradd -r -u 1001 -g nodejs nextjs
>>>>>>> 9ce6ccf (Updated dockerScript)

# Change ownership
RUN chown -R nextjs:nodejs workspace logs

# Switch to non-root user
USER nextjs
>>>>>>> d07d2a6 (Init API)

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
