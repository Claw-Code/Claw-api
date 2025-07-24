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
      origin: true,
      credentials: true,
    })

    // Setup authentication
    await setupAuth(fastify)

    // Register Swagger
    await fastify.register(swagger, {
      swagger: {
        info: {
          title: "🦅 Claw API",
          description: "Auth + Chat Storage with External Game Generation",
          version: "2.0.0",
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
          },
        },
      },
    })

    await fastify.register(swaggerUi, {
      routePrefix: "/docs",
      uiConfig: {
        docExpansion: "list",
        deepLinking: true,
      },
    })

    // Register routes
    await fastify.register(authRoutes, { prefix: "/api/auth" })
    await fastify.register(conversationRoutes, { prefix: "/api/conversations" })

    // Health check
    fastify.get("/health", async () => {
      const dbOk = await database.healthCheck()
      const externalAPIOk = await externalGameAPI.healthCheck()

      return {
        status: dbOk && externalAPIOk ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        services: {
          database: dbOk ? "connected" : "disconnected",
          externalGameAPI: externalAPIOk ? "available" : "unavailable",
        },
      }
    })

    // Start server
    const port = Number.parseInt(process.env.PORT || "8000")
    const host = process.env.HOST || "0.0.0.0"

    await fastify.listen({ port, host })

    console.log(`🦅 Claw API running on http://${host}:${port}`)
    console.log(`📚 API Docs: http://${host}:${port}/docs`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...")
  await database.disconnect()
  await fastify.close()
  process.exit(0)
})

main()
