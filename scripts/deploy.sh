#!/bin/bash

<<<<<<< HEAD
<<<<<<< HEAD
# Deployment script for production - Claw API
=======
# Deployment script for production
>>>>>>> d07d2a6 (Init API)
=======
# Deployment script for production - Claw API
>>>>>>> 9ce6ccf (Updated dockerScript)

echo "🚀 Deploying Claw API to production..."

# Build production image
echo "🔨 Building production image..."
<<<<<<< HEAD
<<<<<<< HEAD
docker build -t claw-api:latest .

# Tag for registry (replace with your registry)
docker tag claw-api:latest your-registry.com/claw-api:latest

# Push to registry
echo "📤 Pushing to registry..."
docker push your-registry.com/claw-api:latest
=======
docker build -t Claw-api:latest .
=======
docker build -t claw-api:latest .
>>>>>>> 9ce6ccf (Updated dockerScript)

# Tag for registry (replace with your registry)
docker tag claw-api:latest your-registry.com/claw-api:latest

# Push to registry
echo "📤 Pushing to registry..."
<<<<<<< HEAD
docker push your-registry.com/Claw-api:latest
>>>>>>> d07d2a6 (Init API)
=======
docker push your-registry.com/claw-api:latest
>>>>>>> 9ce6ccf (Updated dockerScript)

# Deploy with docker-compose
echo "🚀 Deploying services..."
docker-compose -f docker-compose.prod.yml up -d

<<<<<<< HEAD
<<<<<<< HEAD
echo "✅ Claw API deployment complete!"
=======
echo "✅ Deployment complete!"
>>>>>>> d07d2a6 (Init API)
=======
echo "✅ Claw API deployment complete!"
>>>>>>> 9ce6ccf (Updated dockerScript)
