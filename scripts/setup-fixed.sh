#!/bin/bash

# Fixed setup script for Claw API with pre-built MongoDB

echo "🚀 Setting up Claw API with Pre-built MongoDB..."

# Check Docker version
echo "🔍 Checking Docker version..."
docker_version=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
echo "Docker version: $docker_version"

# Check Docker Compose version
echo "🔍 Checking Docker Compose version..."
if command -v docker-compose &> /dev/null; then
    compose_cmd="docker-compose"
    compose_version=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
else
    compose_cmd="docker compose"
    compose_version=$(docker compose version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
fi
echo "Docker Compose version: $compose_version"
echo "Using command: $compose_cmd"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p workspace/downloads
mkdir -p ssl

# Set permissions
chmod 755 workspace
chmod 755 logs

# Copy environment template
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# LLM API Keys
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Database (using pre-built MongoDB container)
MONGODB_URL=mongodb://admin:password123@mongodb:27017/claw_api?authSource=admin
DB_NAME=claw_api

# Application
NODE_ENV=production
PORT=8000
HOST=0.0.0.0
WORKSPACE_DIR=/app/workspace

# Redis
REDIS_URL=redis://redis:6379

# Ollama
OLLAMA_URL=http://ollama:11434
EOF
    echo "⚠️  Please edit .env file with your actual API keys"
fi

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
$compose_cmd down 2>/dev/null || true
docker stop claw-local-dev claw-standalone 2>/dev/null || true
docker rm claw-local-dev claw-standalone 2>/dev/null || true

# Pull MongoDB image first
echo "📥 Pulling MongoDB image..."
docker pull mongo:7.0

# Build and start services
echo "🔨 Building Docker images..."
$compose_cmd build --no-cache

echo "🚀 Starting services..."
$compose_cmd up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 45

# Check if services are running
echo "🔍 Checking service status..."
$compose_cmd ps

# Test API health with retry
echo "🏥 Testing API health..."
max_attempts=15
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:8000/health 2>/dev/null; then
        echo "✅ API health check passed"
        break
    else
        echo "⏳ Attempt $attempt/$max_attempts failed, retrying in 5 seconds..."
        sleep 5
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ API health check failed after $max_attempts attempts"
    echo "📋 Checking logs..."
    $compose_cmd logs api
    echo ""
    echo "📋 MongoDB logs:"
    $compose_cmd logs mongodb
fi

# Test MongoDB connection
echo "🗄️  Testing MongoDB connection..."
if docker exec claw-mongodb mongosh --eval "db.adminCommand('ismaster')" 2>/dev/null; then
    echo "✅ MongoDB connection successful"
else
    echo "❌ MongoDB connection failed"
fi

# Pull Ollama models (optional)
echo "📥 Pulling Ollama models (this may take a while)..."
$compose_cmd exec -T ollama ollama pull codellama:7b 2>/dev/null || echo "⚠️  Ollama not available, skipping model download"

echo "✅ Claw API setup complete!"
echo ""
echo "🌐 API Server: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo "🏥 Health Check: http://localhost:8000/health"
echo "🗄️  MongoDB: mongodb://localhost:27017/claw_api"
echo ""
echo "📋 Service URLs:"
echo "  - API: http://localhost:8000"
echo "  - MongoDB: mongodb://admin:password123@localhost:27017/claw_api?authSource=admin"
echo "  - Redis: redis://localhost:6379"
echo "  - Ollama: http://localhost:11434"
echo ""
echo "To stop the services: $compose_cmd down"
echo "To view logs: $compose_cmd logs -f"
echo ""
echo "🔧 Troubleshooting:"
echo "- If build fails, try: $compose_cmd build --no-cache"
echo "- If ports are busy, check: lsof -i :8000"
echo "- View container logs: $compose_cmd logs [service_name]"
