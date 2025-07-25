import Fastify from "fastify"
import cors from "@fastify/cors"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import { database } from "./config/database"
import { setupAuth } from "./config/auth"
import { authRoutes } from "./routes/auth"
import { conversationRoutes } from "./routes/conversations"
import { ExternalGameAPI } from "./services/ExternalGameAPI"

const fastify = Fastify({
  logger:
    process.env.NODE_ENV === "development"
      ? {
          level: "info",
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
            },
          },
        }
      : true,
})

async function main() {
  try {
    // Connect to database
    await database.connect()

    // Initialize external game API service
    const externalGameAPI = new ExternalGameAPI()

    // Register CORS
    await fastify.register(cors, {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true)

        // Allow localhost and development origins
        if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
          return callback(null, true)
        }

        // Allow all origins in development
        if (process.env.NODE_ENV === "development") {
          return callback(null, true)
        }

        // In production, you'd check against allowed origins
        return callback(null, true)
      },
      credentials: true,
    })

    // Setup authentication FIRST before registering routes
    console.log("🔐 Setting up authentication...")
    await setupAuth(fastify)
    console.log("✅ Authentication setup complete")

    // Register Swagger with examples in the info section
    await fastify.register(swagger, {
      swagger: {
        info: {
          title: "🦅 Claw API",
          description: `
# Claw API - Game Generation with External AI

This API provides user authentication, conversation management, and integrates with an external game generation service.

## 🎮 Game Generation Flow

1. **Create Conversation**: \`POST /api/conversations\`
   - Body: \`{"title": "Snake Game with Power-ups"}\`

2. **Send Message**: \`POST /api/conversations/{id}/messages\` 
   - Form data: \`text=Create a Snake game with HTML5 Canvas...\`

3. **Stream Updates**: Connect to SSE stream at \`/stream\` endpoint
   - Real-time events: progress, file_generated, complete, error

4. **Get Results**: \`GET /api/conversations/{id}\` 
   - Returns complete conversation with all generated files

## 🔗 External API Integration

- **External API**: \`POST localhost:3001/api/generate/simple\`
- **AI Chain**: Groq (LLaMA 3.3 70B) → Qwen3 Coder
- **Output**: HTML5 Canvas games with complete source code

## 📡 Server-Sent Events

The streaming endpoints return real-time updates:
- \`progress\`: Generation progress with step information
- \`file_generated\`: Individual files as they're created
- \`complete\`: Final completion with all files
- \`error\`: Error information if generation fails

## 🔐 Authentication

All endpoints (except /health) require JWT authentication:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

For SSE endpoints, pass token as query parameter:
\`\`\`
/stream?token=<your_jwt_token>
\`\`\`

## 📋 Example Usage

### Register and Login
\`\`\`bash
# Register
curl -X POST http://localhost:8000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"username": "gamer", "email": "gamer@example.com", "password": "password123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "gamer@example.com", "password": "password123"}'
\`\`\`

### Create and Generate Game
\`\`\`bash
# Create conversation
curl -X POST http://localhost:8000/api/conversations \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Snake Game"}'

# Generate game
curl -X POST http://localhost:8000/api/conversations/CONVERSATION_ID/messages \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "text=Create a Snake game with HTML5 Canvas, smooth movement, food collection, score system, collision detection, and responsive mobile controls"
\`\`\`

### Stream Updates
\`\`\`javascript
const eventSource = new EventSource('http://localhost:8000/api/conversations/CONVERSATION_ID/messages/MESSAGE_ID/stream?token=YOUR_JWT_TOKEN');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type, data);
};
\`\`\`
          `,
          version: "2.0.0",
          contact: {
            name: "Claw API Support",
            url: "https://github.com/your-repo/claw-api",
          },
        },
        host: "localhost:8000",
        schemes: ["http"],
        consumes: ["application/json", "multipart/form-data"],
        produces: ["application/json", "text/event-stream"],
        securityDefinitions: {
          bearerAuth: {
            type: "apiKey",
            name: "Authorization",
            in: "header",
            description: "JWT token in format: Bearer <token>",
          },
        },
        tags: [
          {
            name: "Authentication",
            description: "User registration, login, and profile management",
          },
          {
            name: "Conversations",
            description: "Game project conversations and management",
          },
          {
            name: "Messages",
            description: "Game generation messages and real-time streaming",
          },
          {
            name: "System",
            description: "Health checks and system status",
          },
        ],
      },
    })

    await fastify.register(swaggerUi, {
      routePrefix: "/docs",
      uiConfig: {
        docExpansion: "list",
        deepLinking: true,
        tryItOutEnabled: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
    })

    // Register routes AFTER authentication is set up
    console.log("📝 Registering routes...")
    await fastify.register(authRoutes, { prefix: "/api/auth" })
    await fastify.register(conversationRoutes, { prefix: "/api/conversations" })
    console.log("✅ Routes registered successfully")

    // Health check
    fastify.get(
      "/health",
      {
        schema: {
          description: "Health check endpoint - returns system status",
          tags: ["System"],
          response: {
            200: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["ok", "degraded", "error"],
                },
                timestamp: {
                  type: "string",
                  format: "date-time",
                },
                services: {
                  type: "object",
                  properties: {
                    database: {
                      type: "string",
                      enum: ["connected", "disconnected"],
                    },
                    externalGameAPI: {
                      type: "string",
                      enum: ["available", "unavailable"],
                    },
                  },
                },
                version: {
                  type: "string",
                },
              },
            },
          },
        },
      },
      async () => {
        const dbOk = await database.healthCheck()
        const externalAPIOk = await externalGameAPI.healthCheck()

        return {
          status: dbOk && externalAPIOk ? "ok" : "degraded",
          timestamp: new Date().toISOString(),
          services: {
            database: dbOk ? "connected" : "disconnected",
            externalGameAPI: externalAPIOk ? "available" : "unavailable",
          },
          version: "2.0.0",
        }
      },
    )

    // Start server
    const port = Number.parseInt(process.env.PORT || "8000")
    const host = process.env.HOST || "0.0.0.0"

    await fastify.listen({ port, host })

    console.log(`\n🦅 Claw API running on http://localhost:${port}`)
    console.log(`📚 API Docs: http://localhost:${port}/docs`)
    console.log(`🏥 Health Check: http://:localhost${port}/health`)
    console.log(`\n✨ Ready for requests!`)

    // Debug: Check if authentication methods are available
    console.log("🔍 Debug: Authentication methods available:")
    console.log("- authenticate:", typeof fastify.authenticate)
    console.log("- authenticateSSE:", typeof fastify.authenticateSSE)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...")
  try {
    await database.disconnect()
    await fastify.close()
    console.log("✅ Shutdown complete")
  } catch (error) {
    console.error("❌ Error during shutdown:", error)
  }
  process.exit(0)
})

process.on("SIGTERM", async () => {
  console.log("\n🛑 Received SIGTERM, shutting down...")
  try {
    await database.disconnect()
    await fastify.close()
  } catch (error) {
    console.error("❌ Error during shutdown:", error)
  }
  process.exit(0)
})

main()
