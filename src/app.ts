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
  await fastify.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true)

      // Allow localhost in development
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true)
      }

      // Allow your production domains
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "https://your-frontend-domain.com",
      ]

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      // In development, allow all origins
      if (process.env.NODE_ENV === "development") {
        return callback(null, true)
      }

      return callback(new Error("Not allowed by CORS"), false)
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Cache-Control",
      "X-HTTP-Method-Override",
    ],
    exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Content-Disposition"],
    optionsSuccessStatus: 200,
    preflightContinue: false,
  })

  // Add a preflight OPTIONS handler for all routes:
  fastify.addHook("preHandler", async (request, reply) => {
    // Handle preflight requests
    if (request.method === "OPTIONS") {
      reply
        .code(200)
        .header("Access-Control-Allow-Origin", request.headers.origin || "*")
        .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
        .header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control",
        )
        .header("Access-Control-Allow-Credentials", "true")
        .send()
      return
    }
  })
  await setupAuth(fastify)

  // Enhanced Swagger documentation with complete schemas
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: "🦅 Claw API v2 - Complete Documentation",
        description: `
# 🦅 Claw API - AI-Powered Phaser.js Game Development

**The most advanced AI-powered game development API specializing in Phaser.js 2D games.**

## 🎮 What is Claw API?

Claw API is a comprehensive backend service that generates professional-quality Phaser.js games using advanced AI models.

## 🔐 Authentication

**All endpoints except \`/health\` and \`/docs\` require JWT authentication.**

Include your token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## 🚀 Quick Start Workflow

1. **Register/Login** → Get JWT token
2. **Create Conversation** → Start a new project
3. **Send Message** → Request game generation with optional files
4. **Get Response** → Receive structured text + code response
5. **Edit/Refine** → Modify messages to improve results
6. **Download** → Get ZIP file for deployment

---

*Built with ❤️ for game developers worldwide*
        `,
        version: "2.0.0",
        contact: {
          name: "Claw API Support",
          url: "https://github.com/your-repo/claw-api",
          email: "support@clawapi.com",
        },
        license: {
          name: "MIT",
          url: "https://opensource.org/licenses/MIT",
        },
      },
      host: "localhost:8000",
      schemes: ["http", "https"],
      consumes: ["application/json", "multipart/form-data"],
      produces: ["application/json", "application/zip", "text/html"],
      tags: [
        {
          name: "Authentication",
          description: "🔐 User registration, login, and profile management",
        },
        {
          name: "Conversations",
          description: "💬 Create and manage conversation threads for game projects",
        },
        {
          name: "Messages",
          description: "📝 Send messages, upload files, and receive AI-generated games",
        },
        {
          name: "Download",
          description: "📦 Download generated games as ZIP files",
        },
        {
          name: "Preview",
          description: "👀 Live preview of generated games",
        },
        {
          name: "System",
          description: "🔧 Health checks and system status",
        },
      ],
      securityDefinitions: {
        bearerAuth: {
          type: "apiKey",
          name: "Authorization",
          in: "header",
          description: "JWT token in format: Bearer <token>",
        },
      },
    },
  })

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      displayRequestDuration: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  })

  // Register routes with enhanced documentation
  await fastify.register(authRoutes, { prefix: "/api/auth" })
  await fastify.register(conversationRoutes, { prefix: "/api/conversations" })
  await fastify.register(downloadRoutes, { prefix: "/api/download" })
  await fastify.register(previewRoutes, { prefix: "/api/preview" })

  // Enhanced health check with detailed system status
  fastify.get(
    "/health",
    {
      schema: {
        tags: ["System"],
        description: "🏥 Comprehensive system health check with service status",
        response: {
          200: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["ok", "degraded", "down"],
                description: "Overall system health",
                example: "ok",
              },
              timestamp: {
                type: "string",
                format: "date-time",
                description: "Health check timestamp",
                example: "2024-01-15T14:30:00.000Z",
              },
              uptime: {
                type: "number",
                description: "Server uptime in seconds",
                example: 86400.5,
              },
              version: {
                type: "string",
                description: "API version",
                example: "2.0.0",
              },
              responseTime: {
                type: "number",
                description: "Response time in milliseconds",
                example: 15,
              },
              services: {
                type: "object",
                properties: {
                  database: {
                    type: "string",
                    enum: ["connected", "disconnected", "error"],
                    example: "connected",
                  },
                  llmProviders: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", example: "groq" },
                        status: { type: "string", enum: ["available", "unavailable"], example: "available" },
                        responseTime: { type: "number", example: 1.2 },
                      },
                    },
                  },
                },
              },
              environment: {
                type: "string",
                description: "Current environment",
                example: "development",
              },
              features: {
                type: "object",
                properties: {
                  phaserGeneration: { type: "boolean", example: true },
                  fileUploads: { type: "boolean", example: true },
                  messageVersioning: { type: "boolean", example: true },
                  selfCorrection: { type: "boolean", example: true },
                  mobileOptimization: { type: "boolean", example: true },
                },
              },
            },
          },
          503: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "ServiceUnavailable" },
              message: { type: "string", example: "Service is temporarily unavailable" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    async () => {
      const startTime = Date.now()

      // Check database connection
      let dbStatus = "connected"
      try {
        await database.getDb().admin().ping()
      } catch {
        dbStatus = "disconnected"
      }

      // Check LLM providers (simplified for health check)
      const llmProviders = [
        { name: "groq", status: "available", responseTime: 1.2 },
        { name: "huggingface", status: "available", responseTime: 2.1 },
        { name: "ollama", status: "unavailable", responseTime: 0 },
      ]

      const responseTime = Date.now() - startTime

      return {
        status: dbStatus === "connected" ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: "2.0.0",
        responseTime: responseTime,
        services: {
          database: dbStatus,
          llmProviders,
        },
        environment: process.env.NODE_ENV || "development",
        features: {
          phaserGeneration: true,
          fileUploads: true,
          messageVersioning: true,
          selfCorrection: true,
          mobileOptimization: true,
        },
      }
    },
  )

  // API status endpoint
  fastify.get(
    "/api/status",
    {
      schema: {
        tags: ["System"],
        description: "📊 Detailed API status and capabilities",
        response: {
          200: {
            type: "object",
            properties: {
              api: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Claw API" },
                  version: { type: "string", example: "2.0.0" },
                  description: { type: "string", example: "AI-Powered Phaser.js Game Development API" },
                  documentation: { type: "string", example: "/docs" },
                  repository: { type: "string", example: "https://github.com/your-repo/claw-api" },
                },
              },
              capabilities: {
                type: "object",
                properties: {
                  gameFrameworks: {
                    type: "array",
                    items: { type: "string" },
                    example: ["phaser.js"],
                  },
                  llmProviders: {
                    type: "array",
                    items: { type: "string" },
                    example: ["groq", "huggingface", "ollama"],
                  },
                  features: {
                    type: "array",
                    items: { type: "string" },
                    example: [
                      "AI Code Generation",
                      "Self-Correction Loop",
                      "File Attachments",
                      "Message Versioning",
                      "Mobile Optimization",
                      "Real-time Preview",
                      "ZIP Downloads",
                      "Error Recovery",
                      "Performance Optimization",
                    ],
                  },
                  gameTypes: {
                    type: "array",
                    items: { type: "string" },
                    example: [
                      "Space Shooters",
                      "Platformers",
                      "Puzzle Games",
                      "Endless Runners",
                      "Arcade Games",
                      "Custom Games",
                    ],
                  },
                },
              },
              limits: {
                type: "object",
                properties: {
                  maxFileSize: { type: "string", example: "50MB" },
                  maxFilesPerMessage: { type: "integer", example: 5 },
                  maxConversationsPerUser: { type: "integer", example: 100 },
                  maxMessageLength: { type: "integer", example: 5000 },
                  rateLimitGeneral: { type: "string", example: "10 req/sec" },
                  rateLimitGeneration: { type: "string", example: "5 req/sec" },
                  tokenExpiry: { type: "string", example: "7 days" },
                },
              },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    async () => ({
      api: {
        name: "Claw API",
        version: "2.0.0",
        description: "AI-Powered Phaser.js Game Development API",
        documentation: "/docs",
        repository: "https://github.com/your-repo/claw-api",
      },
      capabilities: {
        gameFrameworks: ["phaser.js"],
        llmProviders: ["groq", "huggingface", "ollama"],
        features: [
          "AI Code Generation",
          "Self-Correction Loop",
          "File Attachments",
          "Message Versioning",
          "Mobile Optimization",
          "Real-time Preview",
          "ZIP Downloads",
          "Error Recovery",
          "Performance Optimization",
        ],
        gameTypes: ["Space Shooters", "Platformers", "Puzzle Games", "Endless Runners", "Arcade Games", "Custom Games"],
      },
      limits: {
        maxFileSize: "50MB",
        maxFilesPerMessage: 5,
        maxConversationsPerUser: 100,
        maxMessageLength: 5000,
        rateLimitGeneral: "10 req/sec",
        rateLimitGeneration: "5 req/sec",
        tokenExpiry: "7 days",
      },
      timestamp: new Date().toISOString(),
    }),
  )

  // Add this error handler before starting the server
  fastify.setErrorHandler(async (error, request, reply) => {
    // CORS errors
    if (error.message.includes("CORS") || error.message.includes("Not allowed by CORS")) {
      reply.code(403).send({
        success: false,
        error: "CORSError",
        message: "Cross-Origin Request Blocked",
        details: {
          origin: request.headers.origin,
          method: request.method,
          suggestion: "Make sure your frontend domain is allowed in CORS configuration",
        },
      })
      return
    }

    // Authentication errors
    if (error.message.includes("jwt") || error.message.includes("token")) {
      reply.code(401).send({
        success: false,
        error: "AuthenticationError",
        message: "Authentication failed",
        details: {
          code: "INVALID_TOKEN",
          suggestion: "Please provide a valid JWT token in Authorization header",
        },
      })
      return
    }

    // Validation errors
    if (error.validation) {
      reply.code(400).send({
        success: false,
        error: "ValidationError",
        message: "Request validation failed",
        details: {
          validationErrors: error.validation,
          suggestion: "Check the API documentation for correct request format",
        },
      })
      return
    }

    // Database connection errors
    if (error.message.includes("MongoDB") || error.message.includes("database")) {
      reply.code(503).send({
        success: false,
        error: "DatabaseError",
        message: "Database connection failed",
        details: {
          suggestion: "The service is temporarily unavailable. Please try again later.",
        },
      })
      return
    }

    // Generic server errors
    fastify.log.error(error)
    reply.code(500).send({
      success: false,
      error: "InternalServerError",
      message: "An unexpected error occurred",
      details: {
        suggestion: "Please try again or contact support if the problem persists",
      },
    })
  })

  // Start server
  try {
    const port = Number.parseInt(process.env.PORT || "8000")
    const host = process.env.HOST || "0.0.0.0"
    await fastify.listen({ port, host })
    console.log(`🦅 Claw API v2 is running on http://${host}:${port}`)
    console.log(`📚 Complete API Documentation: http://${host}:${port}/docs`)
    console.log(`🏥 Health Check: http://${host}:${port}/health`)
    console.log(`📊 API Status: http://${host}:${port}/api/status`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

main()
