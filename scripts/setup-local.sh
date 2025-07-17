#!/bin/bash

<<<<<<< HEAD
<<<<<<< HEAD
# Local setup script for v0-like API with embedded MongoDB

echo "🚀 Setting up v0-like API for local development..."
=======
# Local setup script for Claw API with embedded MongoDB

echo "🚀 Setting up Claw API for local development..."
>>>>>>> d07d2a6 (Init API)
=======
# Local setup script for v0-like API with embedded MongoDB

echo "🚀 Setting up v0-like API for local development..."
>>>>>>> 9ce6ccf (Updated dockerScript)

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

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
# Local Development Environment

# LLM API Keys (get free keys from respective providers)
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Database (embedded MongoDB)
MONGODB_URL=mongodb://localhost:27017/v0_clone
DB_NAME=v0_clone

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

# Create local development script
cat > run-local.sh << 'EOF'
#!/bin/bash

<<<<<<< HEAD
<<<<<<< HEAD
echo "🚀 Starting v0-like API in local development mode..."
=======
echo "🚀 Starting Claw API in local development mode..."
>>>>>>> d07d2a6 (Init API)
=======
echo "🚀 Starting v0-like API in local development mode..."
>>>>>>> 9ce6ccf (Updated dockerScript)

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Build and start the local container
docker build -f Dockerfile.local -t v0-local:latest .

echo "🔨 Starting container with embedded MongoDB..."
docker run -d \
    --name v0-local-dev \
    -p 8000:8000 \
    -p 27017:27017 \
    -v $(pwd)/src:/app/src:ro \
    -v $(pwd)/logs:/app/logs \
    -v $(pwd)/workspace:/app/workspace \
    --env-file .env.local \
    v0-local:latest

echo "⏳ Waiting for services to start..."
sleep 15

# Check if container is running
if docker ps | grep -q v0-local-dev; then
    echo "✅ Container started successfully!"
    
    # Show logs
    echo "📋 Container logs:"
    docker logs v0-local-dev --tail 20
    
    echo ""
    echo "🌐 API Server: http://localhost:8000"
    echo "📚 API Documentation: http://localhost:8000/docs"
    echo "🏥 Health Check: http://localhost:8000/health"
    echo "🗄️  MongoDB: mongodb://localhost:27017/v0_clone"
    echo ""
    echo "📋 Useful commands:"
    echo "  View logs: docker logs v0-local-dev -f"
    echo "  Stop: docker stop v0-local-dev"
    echo "  Remove: docker rm v0-local-dev"
    echo "  MongoDB shell: docker exec -it v0-local-dev mongo v0_clone"
    
else
    echo "❌ Failed to start container"
    docker logs v0-local-dev
    exit 1
fi
EOF

chmod +x run-local.sh

# Create stop script
cat > stop-local.sh << 'EOF'
#!/bin/bash
<<<<<<< HEAD
<<<<<<< HEAD
echo "🛑 Stopping v0-like API local development..."
=======
echo "🛑 Stopping Claw API local development..."
>>>>>>> d07d2a6 (Init API)
=======
echo "🛑 Stopping v0-like API local development..."
>>>>>>> 9ce6ccf (Updated dockerScript)
docker stop v0-local-dev 2>/dev/null || true
docker rm v0-local-dev 2>/dev/null || true
echo "✅ Stopped successfully!"
EOF

chmod +x stop-local.sh

# Create MongoDB management script
cat > mongo-shell.sh << 'EOF'
#!/bin/bash
echo "🗄️  Connecting to MongoDB shell..."
docker exec -it v0-local-dev mongo v0_clone
EOF

chmod +x mongo-shell.sh

# Option 1: Single container with embedded MongoDB
echo ""
echo "🎯 Choose your setup option:"
echo "1. Single container with embedded MongoDB (recommended for testing)"
echo "2. Docker Compose with separate services (recommended for development)"
echo ""
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo "🚀 Setting up single container with embedded MongoDB..."
        ./run-local.sh
        ;;
    2)
        echo "🚀 Setting up with Docker Compose..."
        if [ ! -f .env ]; then
            cp .env.local .env
        fi
        docker-compose -f docker-compose.local.yml up -d
        echo "⏳ Waiting for services..."
        sleep 20
        echo "✅ Services started!"
        echo "🌐 API Server: http://localhost:8000"
        echo "📚 API Documentation: http://localhost:8000/docs"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Local setup complete!"
echo ""
echo "🧪 Test the API:"
echo "curl http://localhost:8000/health"
echo ""
echo "📖 Next steps:"
echo "1. Edit .env.local with your LLM API keys"
echo "2. Visit http://localhost:8000/docs for API documentation"
echo "3. Create a user and start generating code!"
