#!/bin/bash

<<<<<<< HEAD
# Deployment script for production - Claw API
=======
# Deployment script for production
>>>>>>> d07d2a6 (Init API)

echo "🚀 Deploying Claw API to production..."

# Build production image
echo "🔨 Building production image..."
<<<<<<< HEAD
docker build -t claw-api:latest .

# Tag for registry (replace with your registry)
docker tag claw-api:latest your-registry.com/claw-api:latest

# Push to registry
echo "📤 Pushing to registry..."
docker push your-registry.com/claw-api:latest
=======
docker build -t Claw-api:latest .

# Tag for registry (replace with your registry)
docker tag Claw-api:latest your-registry.com/Claw-api:latest

# Push to registry
echo "📤 Pushing to registry..."
docker push your-registry.com/Claw-api:latest
>>>>>>> d07d2a6 (Init API)

# Deploy with docker-compose
echo "🚀 Deploying services..."
docker-compose -f docker-compose.prod.yml up -d

<<<<<<< HEAD
echo "✅ Claw API deployment complete!"
=======
echo "✅ Deployment complete!"
>>>>>>> d07d2a6 (Init API)
