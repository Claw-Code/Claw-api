#!/bin/bash

# Fixed local setup script for Claw API with pre-built MongoDB

echo "🚀 Setting up Claw API for local development with Pre-built MongoDB..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker version and compatibility
docker_version=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
echo "🔍 Docker version: $docker_version"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p workspace/downloads
mkdir -p data/mongodb

# Set permissions
chmod 755 workspace
chmod 755 logs
chmod 755 data

# Copy environment template for local development
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Local Development Environment - Claw API

# LLM API Keys (get free keys from respective providers)
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Database (pre-built MongoDB container)
MONGODB_URL=mongodb://mongodb-local:27017/claw_api
DB_NAME=claw_api

# Application
NODE_ENV=development
PORT=8000
HOST=0.0.0.0
WORKSPACE_DIR=/app/workspace

# Ollama (optional local LLM)
OLLAMA_URL=http://ollama-local:11434
EOF
    echo "⚠️  Please edit .env.local file with your actual API keys"
fi

# Determine Docker Compose command
if command -v docker-compose &> /dev/null; then
    compose_cmd="docker-compose"
else
    compose_cmd="docker compose"
fi

# Option selection
echo ""
echo "🎯 Choose your setup option:"
echo "1. Docker Compose with separate MongoDB (recommended for development)"
echo "2. Standalone container with embedded MongoDB (for testing)"
echo "3. Production-like setup with all services"
echo ""
read -p "Enter your choice (1, 2, or 3): " choice

case $choice in
    1)
        echo "🚀 Setting up with Docker Compose and separate MongoDB..."
        if [ ! -f .env ]; then
            cp .env.local .env
        fi
        
        # Pull MongoDB image first
        echo "📥 Pulling MongoDB image..."
        docker pull mongo:7.0
        
        $compose_cmd -f docker-compose.local.yml down 2>/dev/null || true
        $compose_cmd -f docker-compose.local.yml build --no-cache
        $compose_cmd -f docker-compose.local.yml up -d
        
        echo "⏳ Waiting for services..."
        sleep 30
        
        # Test health
        if curl -f http://localhost:8000/health 2>/dev/null; then
            echo "✅ Services started successfully!"
        else
            echo "⚠️  Services may still be starting, check logs: $compose_cmd -f docker-compose.local.yml logs"
        fi
        
        echo "🌐 API Server: http://localhost:8000"
        echo "📚 API Documentation: http://localhost:8000/docs"
        echo "🗄️  MongoDB: mongodb://localhost:27017/claw_api"
        ;;
    2)
        echo "🚀 Setting up standalone container with embedded MongoDB..."
        
        # Pull MongoDB image for reference
        docker pull mongo:7.0
        
        $compose_cmd -f docker-compose.standalone.yml down 2>/dev/null || true
        $compose_cmd -f docker-compose.standalone.yml build --no-cache
        $compose_cmd -f docker-compose.standalone.yml up -d
        
        echo "⏳ Waiting for services (this takes longer for embedded MongoDB)..."
        sleep 45
        
        # Test health
        if curl -f http://localhost:8000/health 2>/dev/null; then
            echo "✅ Standalone service started successfully!"
        else
            echo "⚠️  Service may still be starting, check logs: $compose_cmd -f docker-compose.standalone.yml logs"
        fi
        
        echo "🌐 API Server: http://localhost:8000"
        echo "📚 API Documentation: http://localhost:8000/docs"
        echo "🗄️  MongoDB: mongodb://localhost:27017/claw_api"
        ;;
    3)
        echo "🚀 Setting up production-like environment..."
        if [ ! -f .env ]; then
            cp .env.local .env
        fi
        
        # Pull all images first
        echo "📥 Pulling required images..."
        docker pull mongo:7.0
        docker pull redis:7-alpine
        docker pull nginx:alpine
        
        $compose_cmd down 2>/dev/null || true
        $compose_cmd build --no-cache
        $compose_cmd up -d
        
        echo "⏳ Waiting for all services..."
        sleep 45
        
        # Test health
        if curl -f http://localhost:8000/health 2>/dev/null; then
            echo "✅ All services started successfully!"
        else
            echo "⚠️  Services may still be starting, check logs: $compose_cmd logs"
        fi
        
        echo "🌐 API Server: http://localhost:8000"
        echo "📚 API Documentation: http://localhost:8000/docs"
        echo "🗄️  MongoDB: mongodb://admin:password123@localhost:27017/claw_api?authSource=admin"
        echo "🔴 Redis: redis://localhost:6379"
        echo "🤖 Ollama: http://localhost:11434"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Claw API local setup complete!"
echo ""
echo "🧪 Test the API:"
echo "curl http://localhost:8000/health"
echo ""
echo "📖 Next steps:"
echo "1. Edit .env.local with your LLM API keys"
echo "2. Visit http://localhost:8000/docs for API documentation"
echo "3. Create a user and start generating code!"
echo ""
echo "🛠️  Management commands:"
echo "- View logs: $compose_cmd logs -f"
echo "- Stop services: $compose_cmd down"
echo "- Restart: $compose_cmd restart"
echo "- MongoDB shell: docker exec -it claw-mongodb-local mongosh claw_api"
