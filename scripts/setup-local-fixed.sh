#!/bin/bash

# Fixed local setup script for Claw API with bcrypt native module fix

echo "🚀 Setting up Claw API for local development with bcrypt fix..."

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
MONGODB_HOST=mongodb-local
MONGODB_PORT=27017
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

# Create .npmrc for Docker builds with bcrypt fix
echo "📝 Creating .npmrc for Docker builds..."
cat > .npmrc << EOF
legacy-peer-deps=true
fund=false
audit=false
build-from-source=true
EOF

# Determine Docker Compose command
if command -v docker-compose &> /dev/null; then
    compose_cmd="docker-compose"
else
    compose_cmd="docker compose"
fi

# Clean up any existing containers first
echo "🧹 Cleaning up existing containers..."
$compose_cmd -f docker-compose.local.yml down 2>/dev/null || true
docker stop claw-local-dev claw-standalone 2>/dev/null || true
docker rm claw-local-dev claw-standalone 2>/dev/null || true

# Option selection
echo ""
echo "🎯 Choose your setup option:"
echo "1. Docker Compose with separate MongoDB (recommended for development)"
echo "2. Standalone container with embedded MongoDB (for testing)"
echo ""
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo "🚀 Setting up with Docker Compose and separate MongoDB..."
        if [ ! -f .env ]; then
            cp .env.local .env
        fi
        
        # Pull MongoDB image first
        echo "📥 Pulling MongoDB image..."
        docker pull mongo:7.0
        
        echo "🔨 Building with bcrypt fix..."
        $compose_cmd -f docker-compose.local.yml build --no-cache
        
        echo "🚀 Starting services..."
        $compose_cmd -f docker-compose.local.yml up -d
        
        echo "⏳ Waiting for services (including bcrypt rebuild)..."
        sleep 45
        
        # Test health with retry
        echo "🏥 Testing API health..."
        max_attempts=12
        attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if curl -f http://localhost:8000/health 2>/dev/null; then
                echo "✅ Services started successfully!"
                break
            else
                echo "⏳ Attempt $attempt/$max_attempts, waiting..."
                sleep 5
                ((attempt++))
            fi
        done
        
        if [ $attempt -gt $max_attempts ]; then
            echo "⚠️  Services may still be starting, checking logs..."
            echo "📋 API logs:"
            $compose_cmd -f docker-compose.local.yml logs claw-local --tail 20
        fi
        
        echo "🌐 API Server: http://localhost:8000"
        echo "📚 API Documentation: http://localhost:8000/docs"
        echo "🗄️  MongoDB: mongodb://localhost:27017/claw_api"
        ;;
    2)
        echo "🚀 Setting up standalone container with embedded MongoDB..."
        
        echo "🔨 Building standalone with bcrypt fix..."
        $compose_cmd -f docker-compose.standalone.yml build --no-cache
        
        echo "🚀 Starting standalone service..."
        $compose_cmd -f docker-compose.standalone.yml up -d
        
        echo "⏳ Waiting for services (this takes longer for embedded MongoDB + bcrypt rebuild)..."
        sleep 60
        
        # Test health with retry
        echo "🏥 Testing API health..."
        max_attempts=15
        attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if curl -f http://localhost:8000/health 2>/dev/null; then
                echo "✅ Standalone service started successfully!"
                break
            else
                echo "⏳ Attempt $attempt/$max_attempts, waiting..."
                sleep 5
                ((attempt++))
            fi
        done
        
        if [ $attempt -gt $max_attempts ]; then
            echo "⚠️  Service may still be starting, checking logs..."
            echo "📋 Standalone logs:"
            $compose_cmd -f docker-compose.standalone.yml logs claw-standalone --tail 30
        fi
        
        echo "🌐 API Server: http://localhost:8000"
        echo "📚 API Documentation: http://localhost:8000/docs"
        echo "🗄️  MongoDB: mongodb://localhost:27017/claw_api"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Claw API local setup complete with bcrypt fix!"
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
<<<<<<< HEAD
<<<<<<< HEAD
echo ""
echo "🔧 Troubleshooting:"
echo "- If bcrypt issues persist: ./scripts/fix-bcrypt.sh"
echo "- If build fails: $compose_cmd build --no-cache"
echo "- View container logs: docker logs [container_name] -f"
=======
>>>>>>> 9ce6ccf (Updated dockerScript)
=======
echo ""
echo "🔧 Troubleshooting:"
echo "- If bcrypt issues persist: ./scripts/fix-bcrypt.sh"
echo "- If build fails: $compose_cmd build --no-cache"
echo "- View container logs: docker logs [container_name] -f"
>>>>>>> 19ce577 (convo fix and LLm tune)
