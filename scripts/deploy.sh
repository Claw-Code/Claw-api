#!/bin/bash

# Deployment script for production

echo "🚀 Deploying Claw API to production..."

# Build production image
echo "🔨 Building production image..."
docker build -t Claw-api:latest .

# Tag for registry (replace with your registry)
docker tag Claw-api:latest your-registry.com/Claw-api:latest

# Push to registry
echo "📤 Pushing to registry..."
docker push your-registry.com/Claw-api:latest

# Deploy with docker-compose
echo "🚀 Deploying services..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Deployment complete!"
