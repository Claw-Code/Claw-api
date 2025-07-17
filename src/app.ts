import Fastify from "fastify"
import cors from "@fastify/cors"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import { database } from "./config/database"
import { setupAuth } from "./config/auth"
import { authRoutes } from "./routes/auth"
import { chatRoutes } from "./routes/chat"
import { uploadRoutes } from "./routes/upload"
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

async function main() {
  // Connect to database
  await database.connect()

  // Register plugins
  await fastify.register(cors, { origin: true, credentials: true })
  await setupAuth(fastify)

  // Swagger documentation
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: "Claw API v2",
        description: "Advanced AI-powered code generation API with auth, versioning, and more.",
        version: "2.0.0",
      },
      host: "localhost:8000",
      schemes: ["http"],
      consumes: ["application/json"],
      produces: ["application/json"],
      tags: [
        { name: "Authentication", description: "User authentication and profile" },
        { name: "Chat", description: "Core chat and message management" },
        { name: "Upload", description: "File uploads for LLM context" },
        { name: "Download", description: "Code download endpoints" },
        { name: "Preview", description: "Code preview endpoints" },
      ],
      securityDefinitions: {
        bearerAuth: {
          type: "apiKey",
          name: "Authorization",
          in: "header",
          description: "Enter your JWT token in the format 'Bearer <token>'",
        },
      },
    },
  })

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "full", deepLinking: false },
  })

  // Register routes
  await fastify.register(authRoutes, { prefix: "/api/auth" })
  await fastify.register(chatRoutes, { prefix: "/api/chats" })
  await fastify.register(uploadRoutes, { prefix: "/api/uploads" })
  await fastify.register(downloadRoutes, { prefix: "/api/download" })
  await fastify.register(previewRoutes, { prefix: "/api/preview" })

  // Health check
  fastify.get("/health", async () => ({ status: "ok" }))

  // Start server
  try {
    const port = Number.parseInt(process.env.PORT || "8000")
    const host = process.env.HOST || "0.0.0.0"
    await fastify.listen({ port, host })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

main()
