#!/bin/bash

echo "🚀 Starting Claw API in local development mode..."

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
