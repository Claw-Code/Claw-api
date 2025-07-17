<<<<<<< HEAD
> **⚠️ Important Note:** This is a **backend-only API** built with Fastify. It is **NOT** a Next.js application. Do not run it with `next dev`. Use the provided npm scripts like `npm run dev` to start the server correctly.

=======
>>>>>>> 9ce6ccf (Updated dockerScript)
# 🦅 Claw API

AI-powered code generation API for gaming and development, specializing in 2D and 3D game development with modern web technologies.

## 🚀 Features

- **Multi-LLM Support**: Groq, HuggingFace, Ollama with automatic fallback
- **Gaming Focus**: Specialized prompts for 2D/3D game development
- **Real-time Preview**: Live code compilation and hosting
- **MongoDB Storage**: Persistent chat and user data
- **Docker Ready**: Complete containerization with embedded MongoDB
- **Swagger Docs**: Interactive API documentation
- **Production Ready**: Nginx, Redis, monitoring, and scaling

## 🎮 Gaming Technologies Supported

- **3D Games**: Three.js, React Three Fiber, WebGL
- **2D Games**: Phaser, Canvas API, PixiJS
- **Game Engines**: Custom JavaScript/TypeScript game loops
- **Physics**: Matter.js, Cannon.js integration
- **Audio**: Web Audio API, Howler.js

## 🏃‍♂️ Quick Start

### Option 1: Single Container (Recommended for Testing)
\`\`\`bash
# Clone and setup
git clone <repository>
cd claw-api

# Run setup script
chmod +x scripts/setup-local-fixed.sh
./scripts/setup-local-fixed.sh

# Choose option 1 for single container
\`\`\`

### Option 2: Docker Compose (Recommended for Development)
\`\`\`bash
# Setup with separate services
./scripts/setup-local-fixed.sh

# Choose option 2 for docker-compose
\`\`\`

## 📚 API Documentation

Once running, visit:
- **API Server**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🔧 Environment Variables

Create `.env.local` file:
\`\`\`env
# LLM API Keys
HUGGINGFACE_API_KEY=your_key_here
GROQ_API_KEY=your_key_here

# Database
MONGODB_URL=mongodb://localhost:27017/claw_api
DB_NAME=claw_api

# Application
NODE_ENV=development
PORT=8000
HOST=0.0.0.0
WORKSPACE_DIR=/app/workspace
\`\`\`

## 🧪 Testing

\`\`\`bash
# Run comprehensive tests
npm run local:test

# Test individual endpoints
curl http://localhost:8000/health
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "gamer", "email": "gamer@example.com"}'
\`\`\`

## 🎯 Example Usage

### Create a 3D Game
\`\`\`bash
<<<<<<< HEAD
curl -X POST http://localhost:8000/api/chats/CHAT_ID/messages \
=======
curl -X POST http://localhost:8000/api/chat/CHAT_ID/message \
>>>>>>> 9ce6ccf (Updated dockerScript)
  -H "Content-Type: application/json" \
  -d '{
    "content": "Create a 3D cube game with Three.js where the player can rotate the cube with mouse controls",
    "framework": "next.js"
  }'
\`\`\`

### Create a 2D Platformer
\`\`\`bash
<<<<<<< HEAD
curl -X POST http://localhost:8000/api/chats/CHAT_ID/messages \
=======
curl -X POST http://localhost:8000/api/chat/CHAT_ID/message \
>>>>>>> 9ce6ccf (Updated dockerScript)
  -H "Content-Type: application/json" \
  -d '{
    "content": "Create a 2D platformer game with Phaser.js including player movement, jumping, and collision detection",
    "framework": "react"
  }'
\`\`\`

## 🛠️ Development Commands

\`\`\`bash
npm run dev              # Start development server
npm run build            # Build for production
npm run local:setup      # Setup local environment
npm run local:start      # Start local container
npm run local:stop       # Stop local container
npm run local:test       # Run tests
<<<<<<< HEAD
npm run local:mongo      # Access MongoDB shell (for local setup)
=======
npm run local:mongo      # Access MongoDB shell
>>>>>>> 9ce6ccf (Updated dockerScript)
npm run local:logs       # View container logs
npm run local:clean      # Clean up containers
\`\`\`

## 🐳 Docker Commands

\`\`\`bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild everything
docker-compose build --no-cache
\`\`\`

## 🔧 Troubleshooting

\`\`\`bash
# Run troubleshooting tool
./scripts/troubleshoot.sh

# Common fixes
docker system prune -a                    # Clean up everything
lsof -i :8000                            # Check port usage
docker logs claw-local-dev -f            # View container logs
docker exec -it claw-local-dev bash      # Access container shell
\`\`\`

## 📊 Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │────│   Claw API      │────│   MongoDB       │
│   (Port 80/443) │    │   (Port 8000)   │    │   (Port 27017)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   LLM Services  │
                       │   - Groq        │
                       │   - HuggingFace │
                       │   - Ollama      │
                       └─────────────────┘
\`\`\`

## 🚀 Production Deployment

\`\`\`bash
# Build production image
docker build -t claw-api:latest .

# Deploy with production compose
docker-compose -f docker-compose.prod.yml up -d

# Or use deployment script
./scripts/deploy.sh
\`\`\`

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 🆘 Support

- **Documentation**: http://localhost:8000/docs
- **Issues**: Create an issue in the repository
- **Troubleshooting**: Run `./scripts/troubleshoot.sh`

---

**Claw API** - Empowering game developers with AI-powered code generation 🎮🚀
