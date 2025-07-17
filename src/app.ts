import Fastify from "fastify"
import cors from "@fastify/cors"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import { database } from "./config/database"
import { authRoutes } from "./routes/auth"
import { chatRoutes } from "./routes/chat"
import { downloadRoutes } from "./routes/download"
import { previewRoutes } from "./routes/preview"

const fastify = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
    },
  },
})

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  })

  // Swagger documentation
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: "Claw API",
        description: "AI-powered code generation API for gaming and development",
        version: "1.0.0",
      },
      host: "localhost:8000",
      schemes: ["http", "https"],
      consumes: ["application/json"],
      produces: ["application/json"],
      tags: [
        { name: "Authentication", description: "User authentication endpoints" },
        { name: "Chat", description: "Chat and code generation endpoints" },
        { name: "Download", description: "Code download endpoints" },
        { name: "Preview", description: "Code preview endpoints" },
      ],
    },
  })

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
  })
}

// Register routes
async function registerRoutes() {
  await fastify.register(authRoutes, { prefix: "/api/auth" })
  await fastify.register(chatRoutes, { prefix: "/api/chat" })
  await fastify.register(downloadRoutes, { prefix: "/api/download" })
  await fastify.register(previewRoutes, { prefix: "/api/preview" })
}

// Health check
fastify.get("/health", async (request, reply) => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }
})

// Root endpoint
fastify.get("/", async (request, reply) => {
  return {
    message: "Claw API Server",
    version: "1.0.0",
    docs: "/docs",
    health: "/health",
  }
})

// Start server
async function start() {
  try {
    // Connect to database
    await database.connect()

    // Register plugins and routes
    await registerPlugins()
    await registerRoutes()

    // Start server
    const port = Number.parseInt(process.env.PORT || "8000")
    const host = process.env.HOST || "0.0.0.0"

    await fastify.listen({ port, host })

    console.log(`🚀 Server running at http://${host}:${port}`)
    console.log(`📚 API Documentation: http://${host}:${port}/docs`)
  } catch (error) {
    fastify.log.error(error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...")
  await database.disconnect()
  await fastify.close()
  process.exit(0)
})

start()
