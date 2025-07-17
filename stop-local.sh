#!/bin/bash
echo "🛑 Stopping Claw API local development..."
docker stop v0-local-dev 2>/dev/null || true
docker rm v0-local-dev 2>/dev/null || true
echo "✅ Stopped successfully!"
