#!/bin/bash

# Setup script for Claw API

echo "🚀 Setting up Claw API..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

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

# Database
MONGODB_URL=mongodb://admin:password123@localhost:27017/v0_clone?authSource=admin
DB_NAME=v0_clone

# Application
NODE_ENV=production
PORT=8000
HOST=0.0.0.0
WORKSPACE_DIR=/app/workspace

# Redis
REDIS_URL=redis://localhost:6379

# Ollama
OLLAMA_URL=http://localhost:11434
EOF
    echo "⚠️  Please edit .env file with your actual API keys"
fi

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Test API health
echo "🏥 Testing API health..."
curl -f http://localhost:8000/health || echo "❌ API health check failed"

# Pull Ollama models (optional)
echo "📥 Pulling Ollama models (this may take a while)..."
docker-compose exec ollama ollama pull codellama:7b
docker-compose exec ollama ollama pull llama2:7b

echo "✅ Setup complete!"
echo ""
echo "🌐 API Server: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo "🏥 Health Check: http://localhost:8000/health"
echo ""
echo "To stop the services: docker-compose down"
echo "To view logs: docker-compose logs -f"
