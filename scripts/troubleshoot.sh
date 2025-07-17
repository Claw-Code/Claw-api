#!/bin/bash

# Troubleshooting script for Docker issues - Claw API

echo "🔧 Claw API Troubleshooting Tool"
echo "================================"

# Check Docker installation
echo "1. 🐳 Checking Docker installation..."
if command -v docker &> /dev/null; then
    docker_version=$(docker --version)
    echo "✅ Docker found: $docker_version"
else
    echo "❌ Docker not found. Please install Docker."
    exit 1
fi

# Check Docker daemon
echo ""
echo "2. 🔄 Checking Docker daemon..."
if docker info &> /dev/null; then
    echo "✅ Docker daemon is running"
else
    echo "❌ Docker daemon is not running. Please start Docker."
    exit 1
fi

# Check Docker Compose
echo ""
echo "3. 🔧 Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    compose_version=$(docker-compose --version)
    echo "✅ Docker Compose found: $compose_version"
    compose_cmd="docker-compose"
elif docker compose version &> /dev/null; then
    compose_version=$(docker compose version)
    echo "✅ Docker Compose (plugin) found: $compose_version"
    compose_cmd="docker compose"
else
    echo "❌ Docker Compose not found"
    compose_cmd=""
fi

# Check ports
echo ""
echo "4. 🔌 Checking port availability..."
ports=(8000 27017 6379 11434)
for port in "${ports[@]}"; do
    if lsof -i :$port &> /dev/null; then
        echo "⚠️  Port $port is in use:"
        lsof -i :$port
    else
        echo "✅ Port $port is available"
    fi
done

# Check existing containers
echo ""
echo "5. 📦 Checking existing containers..."
existing_containers=$(docker ps -a --filter "name=claw" --format "table {{.Names}}\t{{.Status}}")
if [ -n "$existing_containers" ]; then
    echo "$existing_containers"
else
    echo "✅ No existing Claw containers found"
fi

# Check images
echo ""
echo "6. 🖼️  Checking Docker images..."
existing_images=$(docker images --filter "reference=*claw*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}")
if [ -n "$existing_images" ]; then
    echo "$existing_images"
else
    echo "ℹ️  No Claw images found"
fi

# System resources
echo ""
echo "7. 💾 Checking system resources..."
echo "Disk space:"
df -h | head -2
echo ""
echo "Memory:"
free -h | head -2

# Cleanup suggestions
echo ""
echo "8. 🧹 Cleanup suggestions:"
echo "To clean up containers: docker container prune"
echo "To clean up images: docker image prune"
echo "To clean up everything: docker system prune -a"

# Fix suggestions
echo ""
echo "9. 🔧 Common fixes:"
echo "- If build fails with 'apk not found': Use Alpine-based images"
echo "- If ports are busy: Stop conflicting services or change ports"
echo "- If permission denied: Try with sudo or check Docker group membership"
echo "- If out of space: Run 'docker system prune -a'"

echo ""
echo "🎯 Quick fix commands:"
echo "./scripts/setup-local-fixed.sh  # Use the fixed setup script"
echo "docker system prune -a          # Clean up everything"
echo "docker-compose down && docker-compose up --build  # Rebuild and restart"
