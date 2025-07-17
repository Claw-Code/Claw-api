#!/bin/bash

# Troubleshooting script for Docker and npm issues - Claw API

echo "🔧 Claw API Troubleshooting Tool"
echo "================================"

# Check Node.js and npm versions
echo "1. 📋 Checking Node.js and npm versions..."
if command -v node &> /dev/null; then
    node_version=$(node --version)
    echo "✅ Node.js found: $node_version"
    
    if command -v npm &> /dev/null; then
        npm_version=$(npm --version)
        echo "✅ npm found: $npm_version"
        
        # Check if npm version is too old
        npm_major=$(echo $npm_version | cut -d. -f1)
        if [ "$npm_major" -lt 9 ]; then
            echo "⚠️  npm version is old, consider updating: npm install -g npm@latest"
        fi
    else
        echo "❌ npm not found"
    fi
else
    echo "❌ Node.js not found. Please install Node.js."
fi

# Check for dependency conflicts
echo ""
echo "2. 🔍 Checking for dependency conflicts..."
if [ -f package.json ]; then
    echo "✅ package.json found"
    
    if [ -f package-lock.json ]; then
        echo "✅ package-lock.json found"
        
        # Check for known problematic packages
        if grep -q "date-fns" package-lock.json; then
            date_fns_version=$(grep -A 1 '"date-fns"' package-lock.json | grep '"version"' | head -1 | cut -d'"' -f4)
            echo "📦 date-fns version: $date_fns_version"
            
            if [[ $date_fns_version == 4.* ]]; then
                echo "⚠️  date-fns v4 detected - this may cause conflicts"
                echo "💡 Solution: Run npm run install:clean"
            fi
        fi
    else
        echo "⚠️  package-lock.json not found"
    fi
    
    if [ -d node_modules ]; then
        echo "✅ node_modules found"
        node_modules_size=$(du -sh node_modules 2>/dev/null | cut -f1)
        echo "📊 node_modules size: $node_modules_size"
    else
        echo "❌ node_modules not found - run npm install"
    fi
else
    echo "❌ package.json not found"
fi

# Check Docker installation
echo ""
echo "3. 🐳 Checking Docker installation..."
if command -v docker &> /dev/null; then
    docker_version=$(docker --version)
    echo "✅ Docker found: $docker_version"
    
    # Check if Docker daemon is running
    if docker info &> /dev/null; then
        echo "✅ Docker daemon is running"
    else
        echo "❌ Docker daemon is not running. Please start Docker."
    fi
else
    echo "❌ Docker not found. Please install Docker."
fi

# Check Docker Compose
echo ""
echo "4. 🔧 Checking Docker Compose..."
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
echo "5. 🔌 Checking port availability..."
ports=(8000 27017 6379 11434)
for port in "${ports[@]}"; do
    if command -v lsof &> /dev/null; then
        if lsof -i :$port &> /dev/null; then
            echo "⚠️  Port $port is in use:"
            lsof -i :$port
        else
            echo "✅ Port $port is available"
        fi
    else
        echo "ℹ️  lsof not available, cannot check port $port"
    fi
done

# Check existing containers
echo ""
echo "6. 📦 Checking existing containers..."
existing_containers=$(docker ps -a --filter "name=claw" --format "table {{.Names}}\t{{.Status}}" 2>/dev/null)
if [ -n "$existing_containers" ]; then
    echo "$existing_containers"
else
    echo "✅ No existing Claw containers found"
fi

# Check images
echo ""
echo "7. 🖼️  Checking Docker images..."
existing_images=$(docker images --filter "reference=*claw*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" 2>/dev/null)
if [ -n "$existing_images" ]; then
    echo "$existing_images"
else
    echo "ℹ️  No Claw images found"
fi

# System resources
echo ""
echo "8. 💾 Checking system resources..."
echo "Disk space:"
df -h | head -2
echo ""
if command -v free &> /dev/null; then
    echo "Memory:"
    free -h | head -2
else
    echo "Memory check not available on this system"
fi

# Cleanup suggestions
echo ""
echo "9. 🧹 Cleanup suggestions:"
echo "To clean up npm: npm run install:clean"
echo "To clean up containers: docker container prune"
echo "To clean up images: docker image prune"
echo "To clean up everything: docker system prune -a"

# Fix suggestions
echo ""
echo "10. 🔧 Common fixes:"
echo ""
echo "📦 NPM Issues:"
echo "- Dependency conflicts: npm run install:clean"
echo "- Legacy peer deps: npm install --legacy-peer-deps"
echo "- Clear cache: npm cache clean --force"
echo "- Update npm: npm install -g npm@latest"
echo ""
echo "🐳 Docker Issues:"
echo "- Build fails: docker-compose build --no-cache"
echo "- Ports busy: Stop conflicting services or change ports"
echo "- Permission denied: Check Docker group membership"
echo "- Out of space: docker system prune -a"
echo ""
echo "🔧 Claw API Specific:"
echo "- Run dependency fix: ./scripts/fix-dependencies.sh"
echo "- Use fixed setup: ./scripts/setup-local-fixed.sh"
echo "- Check logs: docker logs [container_name] -f"

echo ""
echo "🎯 Quick fix commands:"
echo "npm run install:clean              # Fix npm dependencies"
echo "./scripts/fix-dependencies.sh      # Comprehensive dependency fix"
echo "./scripts/setup-local-fixed.sh     # Use the fixed setup script"
echo "docker system prune -a             # Clean up Docker"
