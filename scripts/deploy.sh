#!/bin/bash

# Deployment script for production - Claw API

echo "🚀 Deploying Claw API to production..."

# Build production image
echo "🔨 Building production image..."
docker build -t claw-api:latest .

# Tag for registry (replace with your registry)
docker tag claw-api:latest your-registry.com/claw-api:latest

# Push to registry
echo "📤 Pushing to registry..."
docker push your-registry.com/claw-api:latest

# Deploy with docker-compose
echo "🚀 Deploying services..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Claw API deployment complete!"
