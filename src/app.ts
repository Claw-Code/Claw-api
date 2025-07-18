import Fastify from "fastify"
import cors from "@fastify/cors"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import { database } from "./config/database"
import { setupAuth } from "./config/auth"
import { authRoutes } from "./routes/auth"
import { conversationRoutes } from "./routes/conversations"
import { downloadRoutes } from "./routes/download"
import { previewRoutes } from "./routes/preview"
import { LLMService } from "./services/llm/LLMService"

const fastify = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
    },
  },
})

// Global LLM service instance for debugging
let globalLLMService: LLMService

async function main() {
  // Connect to database
  await database.connect()

  // Initialize global LLM service
  globalLLMService = new LLMService()

  // Register plugins
  await fastify.register(cors, {
    origin: (origin, callback) => {
      if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true)
      }
      // In a real production environment, you would list your allowed domains here.
      // For now, we allow any origin in development.
      if (process.env.NODE_ENV === "development") {
        return callback(null, true)
      }
      return callback(new Error("Not allowed by CORS"), false)
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  })

  await setupAuth(fastify)

  // Enhanced Swagger documentation with streaming info
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: "🦅 Claw API v2 - Streaming & Live Previews",
        description: `
# 🦅 Claw API - AI-Powered Phaser.js Game Development

**The most advanced AI-powered game development API specializing in Phaser.js 2D games, now with real-time streaming and live previews.**

## ⚡ Real-Time Streaming Architecture

Claw API uses **Server-Sent Events (SSE)** to provide a v0-like, real-time generation experience.

### Workflow:
1.  **Initiate**: Send a \`POST\` request to \`/api/conversations/{id}/messages\`.
2.  **Connect**: The API immediately responds with a \`streamUrl\`. Your client connects to this URL using an \`EventSource\`.
3.  **Stream**: The API pushes real-time updates as the AI thinks, writes documentation, generates code files, and creates a live preview.

## 🔐 Authentication

**All endpoints except \`/health\` and \`/docs\` require JWT authentication.** Include your token in the Authorization header: \`Authorization: Bearer <your_jwt_token>\`

---
*Built with ❤️ for game developers worldwide*
        `,
        version: "2.0.0",
        contact: {
          name: "Claw API Support",
          url: "https://github.com/your-repo/claw-api",
          email: "support@clawapi.com",
        },
      },
      host: "localhost:8000",
      schemes: ["http"],
      consumes: ["application/json", "multipart/form-data"],
      produces: ["application/json", "application/zip", "text/event-stream"],
      tags: [
        { name: "Authentication", description: "🔐 User registration, login, and profile management" },
        { name: "Conversations", description: "💬 Create and manage game project conversations" },
        { name: "Messages", description: "📝 Send prompts and stream AI-generated game responses" },
        { name: "Download", description: "📦 Download generated games as ZIP files" },
        { name: "Preview", description: "👀 Live preview of generated games" },
        { name: "System", description: "🔧 Health checks and system status" },
        { name: "Debug", description: "🐛 Debug and testing endpoints" },
      ],
      securityDefinitions: {
        bearerAuth: { type: "apiKey", name: "Authorization", in: "header", description: "JWT: Bearer <token>" },
      },
    },
  })

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      tryItOutEnabled: true,
    },
    staticCSP: true,
  })

  // Register routes
  await fastify.register(authRoutes, { prefix: "/api/auth" })
  await fastify.register(conversationRoutes, { prefix: "/api/conversations" })
  await fastify.register(downloadRoutes, { prefix: "/api/download" })
  await fastify.register(previewRoutes, { prefix: "/api/preview" })

  // Debug endpoint for testing LLM service
  fastify.get(
    "/debug/llm",
    {
      schema: {
        tags: ["Debug"],
        description: "🔧 Debug LLM service directly with detailed logs",
        querystring: {
          type: "object",
          properties: {
            prompt: { type: "string", default: "Create a simple Phaser.js game" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const prompt = (request.query as any)?.prompt || "Create a simple Phaser.js game with a player that can move"

        console.log("🧪 DEBUG: Starting LLM test")
        console.log(`🧪 DEBUG: Prompt: ${prompt}`)

        // Clear previous logs
        globalLLMService.clearLogs()

        const response = await globalLLMService.generateCode(prompt, { framework: "phaser.js" })

        const logs = globalLLMService.getLogs()

        console.log("🧪 DEBUG: LLM test completed")
        console.log(`🧪 DEBUG: Response length: ${response.length}`)

        reply.send({
          success: true,
          prompt: prompt,
          responseLength: response.length,
          logs: logs,
          responsePreview: response.substring(0, 1000) + "...", // First 1000 chars
          fullResponse: response, // Full response for debugging
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error("🚨 DEBUG: LLM test failed:", error)

        const logs = globalLLMService.getLogs()

        reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          details: "LLM service test failed",
          logs: logs,
          timestamp: new Date().toISOString(),
        })
      }
    },
  )

  // Debug endpoint to get current logs
  fastify.get(
    "/debug/logs",
    {
      schema: {
        tags: ["Debug"],
        description: "🔧 Get current LLM service logs",
      },
    },
    async (request, reply) => {
      const logs = globalLLMService.getLogs()
      reply.send({
        success: true,
        logs: logs,
        timestamp: new Date().toISOString(),
      })
    },
  )

  // Debug endpoint to clear logs
  fastify.post(
    "/debug/logs/clear",
    {
      schema: {
        tags: ["Debug"],
        description: "🔧 Clear LLM service logs",
      },
    },
    async (request, reply) => {
      globalLLMService.clearLogs()
      reply.send({
        success: true,
        message: "Logs cleared",
        timestamp: new Date().toISOString(),
      })
    },
  )

  // Enhanced health check
  fastify.get(
    "/health",
    {
      schema: {
        tags: ["System"],
        description: "🏥 Comprehensive system health check",
        response: {
          200: {
            description: "Successful health check",
            type: "object",
            properties: {
              status: { type: "string", example: "ok" },
              timestamp: { type: "string", format: "date-time" },
              services: {
                type: "object",
                properties: {
                  database: { type: "string", enum: ["connected", "disconnected"] },
                  llmProviders: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        available: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const llmService = new LLMService()
      const dbOk = await database.healthCheck()
      const llmStatus = await llmService.getProvidersStatus()
      const isHealthy = dbOk && llmStatus.some((p) => p.available)

      reply.code(isHealthy ? 200 : 503).send({
        status: isHealthy ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        services: {
          database: dbOk ? "connected" : "disconnected",
          llmProviders: llmStatus,
        },
      })
    },
  )

  // Start server
  try {
    const port = Number.parseInt(process.env.PORT || "8000")
    const host = process.env.HOST || "0.0.0.0"
    await fastify.listen({ port, host })
    console.log(`🦅 Claw API v2 is running on http://${host}:${port}`)
    console.log(`📚 API Docs: http://${host}:${port}/docs`)
    console.log(`🐛 Debug LLM: http://${host}:${port}/debug/llm`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

main()
