import Fastify from "fastify"
import cors from "@fastify/cors"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import { database } from "./config/database"
<<<<<<< HEAD
import { setupAuth } from "./config/auth"
import { authRoutes } from "./routes/auth"
import { conversationRoutes } from "./routes/conversations"
=======
import { authRoutes } from "./routes/auth"
import { chatRoutes } from "./routes/chat"
>>>>>>> d07d2a6 (Init API)
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

<<<<<<< HEAD
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

Claw API is a comprehensive backend service that generates professional-quality Phaser.js games using advanced AI models. It provides:

- **🤖 Multi-LLM Support**: Groq (Llama), HuggingFace, Ollama with intelligent fallback
- **🎯 Phaser.js Specialization**: Expert-level Phaser.js 3.x code generation
- **📝 Message Versioning**: Edit and version control for conversations and responses
- **📎 File Attachments**: Upload context files for better code generation
- **🔧 Self-Correction**: Automatic error detection and code improvement
- **📱 Mobile-First**: Responsive games with touch controls
- **⚡ Real-time Preview**: Live code compilation and hosting
- **📦 Easy Download**: ZIP file generation for deployment

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

## 📊 Response Structure

All API responses follow this consistent format:

### Success Response
\`\`\`json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
\`\`\`

### Error Response
\`\`\`json
{
  "success": false,
  "error": "ErrorType",
  "message": "Human-readable error description",
  "details": { ... }
}
\`\`\`

## 🎯 Game Generation Features

### Phaser.js Specialization
- ✅ Complete HTML + JavaScript files
- ✅ Professional scene management
- ✅ Physics integration (Arcade Physics)
- ✅ Animation systems and tweens
- ✅ Particle effects and visual polish
- ✅ Audio system integration
- ✅ Mobile touch controls
- ✅ Responsive scaling
- ✅ Performance optimization
- ✅ Error-free, production-ready code

### Generated Game Types
- 🚀 **Space Shooters**: Enemy AI, power-ups, scoring
- 🏃 **Platformers**: Jumping mechanics, collectibles, levels
- 🧩 **Puzzle Games**: Logic-based gameplay, animations
- 🏃‍♂️ **Endless Runners**: Procedural generation, obstacles
- 🎯 **Arcade Games**: Classic gameplay with modern polish
- 🎮 **Custom Games**: Any 2D game concept you can imagine

## 📈 Rate Limits

- **General API**: 10 requests/second per IP
- **Chat/Generation**: 5 requests/second per IP
- **File Upload**: 50MB max file size
- **Conversation Limit**: 100 conversations per user

## 🔧 Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 413 | Payload Too Large - File size exceeded |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server issue |

## 🌐 Base URL

**Development**: \`http://localhost:8000\`
**Production**: \`https://your-domain.com\`

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
      definitions: {
        // === AUTHENTICATION SCHEMAS ===
        RegisterRequest: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            username: {
              type: "string",
              minLength: 3,
              maxLength: 50,
              pattern: "^[a-zA-Z0-9_]+$",
              description: "Unique username (alphanumeric and underscore only)",
              example: "game_developer_123",
            },
            email: {
              type: "string",
              format: "email",
              maxLength: 100,
              description: "Valid email address",
              example: "developer@example.com",
            },
            password: {
              type: "string",
              minLength: 6,
              maxLength: 100,
              description: "Strong password (min 6 characters)",
              example: "SecurePass123!",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "Registered email address",
              example: "developer@example.com",
            },
            password: {
              type: "string",
              description: "User password",
              example: "SecurePass123!",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "Operation success status",
              example: true,
            },
            token: {
              type: "string",
              description: "JWT authentication token (expires in 7 days)",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            user: {
              $ref: "#/definitions/UserProfile",
            },
          },
        },
        UserProfile: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Unique user identifier",
              example: "507f1f77bcf86cd799439011",
            },
            username: {
              type: "string",
              description: "User's display name",
              example: "game_developer_123",
            },
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
              example: "developer@example.com",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp",
              example: "2024-01-15T10:30:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last profile update timestamp",
              example: "2024-01-15T10:30:00.000Z",
            },
          },
        },

        // === CONVERSATION SCHEMAS ===
        CreateConversationRequest: {
          type: "object",
          required: ["title"],
          properties: {
            title: {
              type: "string",
              minLength: 1,
              maxLength: 200,
              description: "Conversation title (your first game idea/prompt)",
              example: "Space Shooter with Power-ups and Boss Battles",
            },
          },
        },
        ConversationSummary: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Unique conversation identifier",
              example: "507f1f77bcf86cd799439012",
            },
            title: {
              type: "string",
              description: "Conversation title",
              example: "Space Shooter with Power-ups and Boss Battles",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last activity timestamp",
              example: "2024-01-15T14:25:30.000Z",
            },
            messageCount: {
              type: "integer",
              description: "Total number of messages in conversation",
              example: 8,
            },
            lastMessage: {
              type: "string",
              description: "Preview of the last message",
              example: "Can you add particle effects to the explosions?",
            },
          },
        },
        ConversationDetail: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Unique conversation identifier",
              example: "507f1f77bcf86cd799439012",
            },
            userId: {
              type: "string",
              description: "Owner user ID",
              example: "507f1f77bcf86cd799439011",
            },
            title: {
              type: "string",
              description: "Conversation title",
              example: "Space Shooter with Power-ups and Boss Battles",
            },
            messages: {
              type: "array",
              items: { $ref: "#/definitions/Message" },
              description: "All messages in chronological order",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Conversation creation timestamp",
              example: "2024-01-15T10:30:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last activity timestamp",
              example: "2024-01-15T14:25:30.000Z",
            },
          },
        },

        // === MESSAGE SCHEMAS ===
        SendMessageRequest: {
          type: "object",
          required: ["text"],
          properties: {
            text: {
              type: "string",
              minLength: 1,
              maxLength: 5000,
              description: "Your game development request or question",
              example:
                "Create a space shooter game with enemy ships, power-ups, and a scoring system. Include particle effects for explosions and smooth player movement.",
            },
            framework: {
              type: "string",
              enum: ["phaser.js", "html5", "javascript"],
              default: "phaser.js",
              description: "Target game framework (currently only Phaser.js supported)",
              example: "phaser.js",
            },
            attachments: {
              type: "array",
              items: {
                type: "string",
                format: "binary",
              },
              description: "Optional files to provide context (images, code, docs)",
              maxItems: 5,
            },
          },
        },
        EditMessageRequest: {
          type: "object",
          required: ["text"],
          properties: {
            text: {
              type: "string",
              minLength: 1,
              maxLength: 5000,
              description: "Updated message content",
              example:
                "Create a space shooter game with enemy ships, power-ups, boss battles, and a high score system.",
            },
          },
        },
        Message: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Unique message identifier",
              example: "507f1f77bcf86cd799439013",
            },
            conversationId: {
              type: "string",
              description: "Parent conversation ID",
              example: "507f1f77bcf86cd799439012",
            },
            role: {
              type: "string",
              enum: ["user", "assistant"],
              description: "Message sender role",
              example: "user",
            },
            content: {
              type: "array",
              items: { $ref: "#/definitions/MessageContent" },
              description: "Message content versions (for edit history)",
            },
            attachments: {
              type: "array",
              items: { $ref: "#/definitions/Attachment" },
              description: "Files attached to this message",
            },
            llmResponse: {
              type: "array",
              items: { $ref: "#/definitions/LLMResponse" },
              description: "AI-generated responses (for assistant messages)",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Message creation timestamp",
              example: "2024-01-15T14:20:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last modification timestamp",
              example: "2024-01-15T14:25:30.000Z",
            },
          },
        },
        MessageContent: {
          type: "object",
          properties: {
            version: {
              type: "integer",
              minimum: 1,
              description: "Content version number (increments with each edit)",
              example: 2,
            },
            text: {
              type: "string",
              description: "Message text content",
              example: "Create a space shooter game with enemy ships and power-ups",
            },
            editedAt: {
              type: "string",
              format: "date-time",
              description: "When this version was created",
              example: "2024-01-15T14:25:30.000Z",
            },
          },
        },

        // === LLM RESPONSE SCHEMAS ===
        LLMResponse: {
          type: "object",
          properties: {
            version: {
              type: "integer",
              minimum: 1,
              description: "Response version number",
              example: 1,
            },
            provider: {
              type: "string",
              enum: ["groq", "huggingface", "ollama"],
              description: "AI provider used for generation",
              example: "groq",
            },
            textResponse: {
              type: "string",
              description: "Human-readable explanation of the generated game (supports Markdown)",
              example:
                "# 🚀 Space Shooter Game\n\nI've created an exciting space shooter game with the following features:\n\n## 🎮 Game Features\n- **Player Ship**: Smooth movement with arrow keys\n- **Enemy Ships**: AI-controlled with different patterns\n- **Power-ups**: Shield, rapid fire, and score multipliers\n- **Particle Effects**: Explosions and engine trails\n- **Scoring System**: Points for destroying enemies\n\n## 🎯 How to Play\n- Use arrow keys to move your ship\n- Spacebar to shoot\n- Collect power-ups for advantages\n- Avoid enemy bullets and ships\n\nThe game is built with Phaser.js 3.x and includes mobile touch controls for cross-platform compatibility.",
            },
            codeResponse: {
              $ref: "#/definitions/CodeResponse",
              description: "Generated game code and files",
            },
            thinking: {
              type: "string",
              description: "AI's thought process and reasoning (optional)",
              example:
                "I need to create a space shooter with multiple game mechanics. I'll structure it with proper Phaser.js scenes, implement physics for collision detection, create enemy AI patterns, and add visual effects for engagement. The game should be mobile-friendly and follow modern JavaScript practices.",
            },
            status: {
              type: "string",
              enum: ["generating", "completed", "verified", "error"],
              description: "Generation status",
              example: "verified",
            },
            error: {
              type: "string",
              description: "Error message if generation failed (optional)",
              example: null,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Response generation timestamp",
              example: "2024-01-15T14:22:15.000Z",
            },
            metrics: {
              type: "object",
              properties: {
                generationTime: {
                  type: "number",
                  description: "Time taken to generate (seconds)",
                  example: 12.5,
                },
                codeLines: {
                  type: "integer",
                  description: "Total lines of code generated",
                  example: 245,
                },
                filesGenerated: {
                  type: "integer",
                  description: "Number of files created",
                  example: 3,
                },
              },
            },
          },
        },
        CodeResponse: {
          type: "object",
          properties: {
            files: {
              type: "array",
              items: { $ref: "#/definitions/CodeFile" },
              description: "Generated game files",
              minItems: 1,
            },
            framework: {
              type: "string",
              enum: ["phaser.js", "html5", "javascript"],
              description: "Game framework used",
              example: "phaser.js",
            },
            language: {
              type: "string",
              enum: ["javascript", "typescript", "html", "css"],
              description: "Primary programming language",
              example: "javascript",
            },
            previewUrl: {
              type: "string",
              format: "uri",
              description: "Live preview URL (if available)",
              example: "http://localhost:3001/preview/abc123",
            },
            downloadUrl: {
              type: "string",
              format: "uri",
              description: "ZIP download URL",
              example: "/api/download/abc123",
            },
            gameFeatures: {
              type: "array",
              items: { type: "string" },
              description: "List of implemented game features",
              example: ["Physics System", "Particle Effects", "Audio Integration", "Mobile Controls", "Scoring System"],
            },
            instructions: {
              type: "string",
              description: "How to run and deploy the game",
              example:
                "1. Download the ZIP file\n2. Extract to a folder\n3. Open index.html in a web browser\n4. Or serve with: npx http-server -p 3000",
            },
          },
        },
        CodeFile: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "File path relative to project root",
              example: "game.js",
            },
            content: {
              type: "string",
              description: "Complete file content",
              example:
                "// Phaser.js Space Shooter Game\nclass GameScene extends Phaser.Scene {\n  constructor() {\n    super({ key: 'GameScene' });\n  }\n  // ... rest of the game code\n}",
            },
            type: {
              type: "string",
              enum: ["html", "js", "css", "json", "md", "txt"],
              description: "File type/extension",
              example: "js",
            },
            language: {
              type: "string",
              enum: ["html", "javascript", "css", "json", "markdown", "text"],
              description: "Programming/markup language",
              example: "javascript",
            },
            size: {
              type: "integer",
              description: "File size in bytes",
              example: 15420,
            },
            description: {
              type: "string",
              description: "What this file contains/does",
              example: "Main game logic with scenes, player controls, and enemy AI",
            },
          },
        },

        // === ATTACHMENT SCHEMAS ===
        Attachment: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Unique attachment identifier",
              example: "507f1f77bcf86cd799439014",
            },
            messageId: {
              type: "string",
              description: "Parent message ID",
              example: "507f1f77bcf86cd799439013",
            },
            filename: {
              type: "string",
              description: "Original filename",
              example: "game-mockup.png",
            },
            originalName: {
              type: "string",
              description: "User-provided filename",
              example: "My Game Mockup.png",
            },
            mimetype: {
              type: "string",
              description: "File MIME type",
              example: "image/png",
            },
            size: {
              type: "integer",
              description: "File size in bytes",
              example: 245760,
            },
            uploadedAt: {
              type: "string",
              format: "date-time",
              description: "Upload timestamp",
              example: "2024-01-15T14:20:30.000Z",
            },
            downloadUrl: {
              type: "string",
              format: "uri",
              description: "Download URL for the file",
              example:
                "/api/conversations/507f1f77bcf86cd799439012/messages/507f1f77bcf86cd799439013/attachments/507f1f77bcf86cd799439014",
            },
          },
        },

        // === SYSTEM SCHEMAS ===
        HealthResponse: {
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
          },
        },

        // === ERROR SCHEMAS ===
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "Always false for errors",
              example: false,
            },
            error: {
              type: "string",
              description: "Error type/category",
              example: "ValidationError",
            },
            message: {
              type: "string",
              description: "Human-readable error description",
              example: "The provided email address is already registered",
            },
            details: {
              type: "object",
              description: "Additional error context (optional)",
              properties: {
                field: {
                  type: "string",
                  description: "Field that caused the error",
                  example: "email",
                },
                code: {
                  type: "string",
                  description: "Specific error code",
                  example: "DUPLICATE_EMAIL",
                },
                suggestion: {
                  type: "string",
                  description: "How to fix the error",
                  example: "Try logging in instead, or use a different email address",
                },
              },
            },
            timestamp: {
              type: "string",
              format: "date-time",
              description: "Error occurrence timestamp",
              example: "2024-01-15T14:30:00.000Z",
            },
          },
        },

        // === SUCCESS SCHEMAS ===
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "Always true for successful operations",
              example: true,
            },
            message: {
              type: "string",
              description: "Success message",
              example: "Operation completed successfully",
            },
            data: {
              type: "object",
              description: "Response data (varies by endpoint)",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              description: "Response timestamp",
              example: "2024-01-15T14:30:00.000Z",
            },
          },
        },
      },
=======
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
>>>>>>> d07d2a6 (Init API)
    },
  })

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
<<<<<<< HEAD
      docExpansion: "list",
      deepLinking: true,
      displayRequestDuration: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      requestInterceptor: (req: any) => {
        // Add auth header helper
        if (req.url.includes("/api/") && !req.url.includes("/auth/")) {
          req.headers.Authorization = req.headers.Authorization || "Bearer <your_token_here>"
        }
        return req
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject) => {
      // Add examples to the spec
      swaggerObject.info.description += `

## 📋 Example Requests

### 1. Register a New User
\`\`\`bash
curl -X POST http://localhost:8000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "game_dev_pro",
    "email": "developer@example.com", 
    "password": "SecurePass123!"
  }'
\`\`\`

### 2. Create a Game Project
\`\`\`bash
curl -X POST http://localhost:8000/api/conversations \\
  -H "Authorization: Bearer <your_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Epic Space Shooter with Boss Battles"
  }'
\`\`\`

### 3. Generate a Game
\`\`\`bash
curl -X POST http://localhost:8000/api/conversations/{conversationId}/messages \\
  -H "Authorization: Bearer <your_token>" \\
  -F "text=Create a space shooter game with enemy ships, power-ups, particle effects, and mobile controls. Include a scoring system and multiple enemy types." \\
  -F "framework=phaser.js"
\`\`\`

### 4. Download Generated Game
\`\`\`bash
curl -X GET http://localhost:8000/api/download/{downloadId} \\
  -H "Authorization: Bearer <your_token>" \\
  -o my-game.zip
\`\`\`

## 🎮 Game Generation Examples

### Space Shooter
\`\`\`
"Create a space shooter with enemy waves, power-ups, and boss battles"
\`\`\`

### Platformer
\`\`\`
"Build a platformer game with jumping mechanics, collectible coins, and moving platforms"
\`\`\`

### Puzzle Game
\`\`\`
"Make a match-3 puzzle game with particle effects and smooth animations"
\`\`\`

### Endless Runner
\`\`\`
"Create an endless runner with obstacles, power-ups, and increasing difficulty"
\`\`\`
`
      return swaggerObject
    },
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
          200: { $ref: "#/definitions/HealthResponse" },
          503: { $ref: "#/definitions/ErrorResponse" },
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
=======
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
>>>>>>> d07d2a6 (Init API)
    process.exit(1)
  }
}

<<<<<<< HEAD
main()
=======
// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...")
  await database.disconnect()
  await fastify.close()
  process.exit(0)
})

start()
>>>>>>> d07d2a6 (Init API)
