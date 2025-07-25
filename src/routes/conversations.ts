import type { FastifyInstance } from "fastify"
import { ConversationModel } from "../models/Conversation"
import { ExternalGameAPI } from "../services/ExternalGameAPI"
import type { AuthPayload, MessageContent, GameResponse } from "../types"
import multipart from "@fastify/multipart"
import type { Writable } from "stream"

// Enhanced stream storage with metadata
interface StreamInfo {
  stream: Writable
  conversationId: string
  messageId: string
  userId: string
  createdAt: Date
  isActive: boolean
}

declare global {
  var activeStreams: Map<string, StreamInfo> | undefined
  var pendingGenerations: Map<string, { prompt: string; timestamp: Date }> | undefined
}

if (!global.activeStreams) {
  global.activeStreams = new Map()
}
if (!global.pendingGenerations) {
  global.pendingGenerations = new Map()
}

export async function conversationRoutes(fastify: FastifyInstance) {
  await fastify.register(multipart)

  const conversationModel = new ConversationModel()
  const externalGameAPI = new ExternalGameAPI()

  // Verify authentication methods are available
  console.log("🔍 Conversation routes: Checking authentication methods...")
  console.log("- authenticate:", typeof fastify.authenticate)
  console.log("- authenticateSSE:", typeof fastify.authenticateSSE)

  if (typeof fastify.authenticate !== "function") {
    throw new Error("fastify.authenticate is not available - authentication not properly set up")
  }
  if (typeof fastify.authenticateSSE !== "function") {
    throw new Error("fastify.authenticateSSE is not available - SSE authentication not properly set up")
  }

  // Create new conversation
  fastify.post<{ Body: { title: string } }>(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Conversations"],
        description: "Create a new conversation for a game project",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["title"],
          properties: {
            title: {
              type: "string",
              minLength: 1,
              maxLength: 200,
              description: "The initial idea/title for your game project",
            },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  title: { type: "string" },
                  messages: { type: "array", items: { type: "object" } },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.user as AuthPayload
      const { title } = request.body

      try {
        const conversation = await conversationModel.create(userId, title)
        reply.code(201).send({
          success: true,
          data: conversation,
          message: "Conversation created successfully",
        })
      } catch (error) {
        reply.code(500).send({
          success: false,
          error: "InternalServerError",
          message: "Failed to create conversation",
        })
      }
    },
  )

  // List all conversations for user
  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Conversations"],
        description: "List all conversations for the authenticated user with preview data",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    _id: { type: "string" },
                    title: { type: "string" },
                    updatedAt: { type: "string", format: "date-time" },
                    lastGameResponse: {
                      type: "object",
                      nullable: true,
                      properties: {
                        status: { type: "string", enum: ["generating", "completed", "error"] },
                        filesCount: { type: "number" },
                        gameType: { type: "string" },
                        framework: { type: "string" },
                        previewUrl: { type: "string", nullable: true },
                        previewFiles: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              path: { type: "string" },
                              type: { type: "string" },
                              language: { type: "string" },
                              size: { type: "number" },
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
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.user as AuthPayload
      console.log(`📋 Getting conversations list for user: ${userId}`)

      const conversations = await conversationModel.findByUserIdWithPreview(userId)

      console.log(`📊 Returning ${conversations.length} conversations`)
      conversations.forEach((conv, index) => {
        console.log(`${index + 1}. ${conv.title} - Files: ${conv.lastGameResponse?.filesCount || 0}`)
      })

      reply.send({
        success: true,
        data: conversations,
      })
    },
  )

  // Get single conversation with complete data
  fastify.get<{ Params: { conversationId: string } }>(
    "/:conversationId",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Conversations"],
        description: "Get a single conversation with complete message history and all generated files",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            conversationId: {
              type: "string",
              description: "Conversation ID",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  title: { type: "string" },
                  messages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        _id: { type: "string" },
                        role: { type: "string", enum: ["user", "assistant"] },
                        content: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              version: { type: "number" },
                              text: { type: "string" },
                              editedAt: { type: "string", format: "date-time" },
                            },
                          },
                        },
                        gameResponse: {
                          type: "object",
                          nullable: true,
                          properties: {
                            version: { type: "number" },
                            prompt: { type: "string" },
                            status: { type: "string", enum: ["generating", "completed", "error"] },
                            files: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  path: { type: "string" },
                                  content: { type: "string" },
                                  type: { type: "string" },
                                  language: { type: "string" },
                                },
                              },
                            },
                            metadata: {
                              type: "object",
                              properties: {
                                gameType: { type: "string" },
                                framework: { type: "string" },
                                features: {
                                  type: "array",
                                  items: { type: "string" },
                                },
                              },
                            },
                            error: { type: "string", nullable: true },
                            createdAt: { type: "string", format: "date-time" },
                          },
                        },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                  summary: {
                    type: "object",
                    properties: {
                      totalMessages: { type: "number" },
                      userMessages: { type: "number" },
                      assistantMessages: { type: "number" },
                      totalFiles: { type: "number" },
                      lastActivity: { type: "string", format: "date-time" },
                      gameStatus: { type: "string", enum: ["none", "generating", "completed", "error"] },
                    },
                  },
                },
              },
            },
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { conversationId } = request.params
      const conversation = await conversationModel.findByIdWithSummary(conversationId)

      if (!conversation || conversation.userId.toString() !== (request.user as AuthPayload).userId) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Conversation not found or access denied",
        })
      }

      reply.send({
        success: true,
        data: conversation,
      })
    },
  )

  // Game preview endpoint - serves the HTML file
  fastify.get<{ Params: { conversationId: string } }>(
    "/:conversationId/preview",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Conversations"],
        description: "Get HTML preview of the generated game",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            conversationId: { type: "string" },
          },
        },
        produces: ["text/html"],
      },
    },
    async (request, reply) => {
      const { conversationId } = request.params
      const { userId } = request.user as AuthPayload

      const conversation = await conversationModel.findById(conversationId)
      if (!conversation || conversation.userId.toString() !== userId) {
        return reply.code(404).send({ error: "Not Found" })
      }

      const files = await conversationModel.getLatestGameFiles(conversationId)
      if (files.length === 0) {
        return reply.code(404).send({ error: "No game files found" })
      }

      // Find the HTML file
      const htmlFile = files.find((file) => file.path === "index.html" || file.type === "html")
      if (!htmlFile) {
        return reply.code(404).send({ error: "No HTML file found" })
      }

      // Serve the HTML content
      reply.type("text/html")
      reply.send(htmlFile.content)
    },
  )

  // Send message and initiate game generation
  fastify.post<{ Params: { conversationId: string } }>(
    "/:conversationId/messages",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Messages"],
        description: "Send a message to generate a game using external API with real-time streaming",
        security: [{ bearerAuth: [] }],
        consumes: ["multipart/form-data"],
        params: {
          type: "object",
          properties: {
            conversationId: {
              type: "string",
              description: "Conversation ID",
            },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  messageId: { type: "string" },
                  conversationId: { type: "string" },
                  streamUrl: { type: "string" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { conversationId } = request.params
      const { userId } = request.user as AuthPayload

      try {
        const conversation = await conversationModel.findById(conversationId)
        if (!conversation || conversation.userId.toString() !== userId) {
          return reply.code(404).send({
            success: false,
            error: "Not Found",
            message: "Conversation not found or access denied",
          })
        }

        const parts = request.parts()
        let messageText = ""

        for await (const part of parts) {
          if (part.type === "field" && part.fieldname === "text") {
            messageText = part.value as string
          }
        }

        if (!messageText.trim()) {
          return reply.code(400).send({
            success: false,
            error: "ValidationError",
            message: "Message text is required",
          })
        }

        console.log(`🎮 Received game generation request: "${messageText.substring(0, 100)}..."`)

        const messageContent: MessageContent = {
          version: 1,
          text: messageText,
          editedAt: new Date(),
        }

        const updatedConversation = await conversationModel.addMessage(conversationId, {
          conversationId: conversation._id!,
          role: "user",
          content: [messageContent],
        })

        if (!updatedConversation || !updatedConversation.messages || updatedConversation.messages.length === 0) {
          return reply.code(500).send({
            success: false,
            error: "InternalServerError",
            message: "Failed to add message",
          })
        }

        const userMessage = updatedConversation.messages[updatedConversation.messages.length - 1]
        const streamKey = `${conversationId}:${userMessage._id}`

        console.log(`💾 Message saved to DB: ${userMessage._id}`)
        console.log(`🔑 Stream key will be: ${streamKey}`)

        // Store the pending generation
        global.pendingGenerations.set(streamKey, {
          prompt: messageText,
          timestamp: new Date(),
        })

        console.log(`⏳ Stored pending generation for: ${streamKey}`)

        reply.code(201).send({
          success: true,
          data: {
            messageId: userMessage._id.toString(),
            conversationId,
            streamUrl: `/api/conversations/${conversationId}/messages/${userMessage._id}/stream`,
          },
          message: "Message sent successfully. Connect to streamUrl for real-time generation updates.",
        })
      } catch (error) {
        console.error(`❌ Error in POST /messages:`, error)
        reply.code(500).send({
          success: false,
          error: "InternalServerError",
          message: "An unexpected error occurred",
        })
      }
    },
  )

  // Server-Sent Events streaming endpoint - USES SSE AUTHENTICATION
  fastify.get<{
    Params: { conversationId: string; messageId: string }
    Querystring: { token?: string }
  }>(
    "/:conversationId/messages/:messageId/stream",
    {
      onRequest: [fastify.authenticateSSE], // Use SSE-specific authentication
      schema: {
        tags: ["Messages"],
        description:
          "Real-Time Game Generation Stream using External API (Server-Sent Events). Token can be passed as query parameter: ?token=YOUR_JWT_TOKEN",
        produces: ["text/event-stream"],
        params: {
          type: "object",
          properties: {
            conversationId: { type: "string" },
            messageId: { type: "string" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "JWT token for authentication (required for SSE since headers aren't supported)",
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { conversationId, messageId } = request.params
      const { userId } = request.user as AuthPayload

      console.log(`🔐 SSE: Stream request authenticated for user ${userId}`)

      const conversation = await conversationModel.findById(conversationId)
      if (!conversation || conversation.userId.toString() !== userId) {
        console.log(`❌ SSE: Access denied for conversation ${conversationId}`)
        return reply.code(404).send({ error: "Not Found" })
      }

      // Set SSE headers
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      })

      const streamKey = `${conversationId}:${messageId}`

      // Create stream info
      const streamInfo: StreamInfo = {
        stream: reply.raw,
        conversationId,
        messageId,
        userId,
        createdAt: new Date(),
        isActive: true,
      }

      global.activeStreams.set(streamKey, streamInfo)

      console.log(`📡 SSE stream connected: ${streamKey}`)
      console.log(`📊 Active streams: ${global.activeStreams.size}`)

      // Send initial connection confirmation
      reply.raw.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`)

      // Check if there's a pending generation and start it
      const pendingGeneration = global.pendingGenerations.get(streamKey)
      if (pendingGeneration) {
        console.log(`🚀 Found pending generation for ${streamKey}, starting immediately...`)

        // Start generation immediately
        setTimeout(() => {
          startGameGeneration(conversationId, messageId, pendingGeneration.prompt).catch((error) => {
            console.error(`❌ Game generation failed for message ${messageId}:`, error)
          })
        }, 500) // Small delay to ensure stream is ready

        // Remove from pending
        global.pendingGenerations.delete(streamKey)
      } else {
        console.log(`⚠️ No pending generation found for ${streamKey}`)

        // Send a waiting message
        reply.raw.write(
          `data: ${JSON.stringify({
            type: "waiting",
            message: "Waiting for generation request...",
            timestamp: new Date().toISOString(),
          })}\n\n`,
        )
      }

      // Clean up on client disconnect
      const cleanup = () => {
        console.log(`🔌 Client disconnected ${streamKey}`)
        const streamInfo = global.activeStreams.get(streamKey)
        if (streamInfo) {
          streamInfo.isActive = false
          global.activeStreams.delete(streamKey)
        }
        global.pendingGenerations.delete(streamKey)
      }

      request.raw.on("close", cleanup)
      request.raw.on("error", cleanup)

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        const streamInfo = global.activeStreams.get(streamKey)
        if (streamInfo && streamInfo.isActive && !streamInfo.stream.destroyed) {
          try {
            streamInfo.stream.write(
              `data: ${JSON.stringify({ type: "ping", timestamp: new Date().toISOString() })}\n\n`,
            )
          } catch (error) {
            console.log(`❌ Ping failed for ${streamKey}, cleaning up`)
            clearInterval(pingInterval)
            cleanup()
          }
        } else {
          clearInterval(pingInterval)
          cleanup()
        }
      }, 30000)

      // Cleanup interval on disconnect
      request.raw.on("close", () => {
        clearInterval(pingInterval)
      })
    },
  )

  // Delete conversation
  fastify.delete<{ Params: { conversationId: string } }>(
    "/:conversationId",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Conversations"],
        description: "Delete an entire conversation and all its messages",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            conversationId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { conversationId } = request.params
      const { userId } = request.user as AuthPayload

      const conversation = await conversationModel.findById(conversationId)
      if (!conversation || conversation.userId.toString() !== userId) {
        return reply.code(404).send({ success: false, error: "Not Found" })
      }

      const success = await conversationModel.deleteById(conversationId)
      if (success) {
        reply.send({ success: true, message: "Conversation deleted successfully" })
      } else {
        reply.code(500).send({ success: false, error: "Internal Server Error" })
      }
    },
  )

  // Debug endpoint to check active streams
  fastify.get(
    "/debug/streams",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Debug"],
        description: "Debug endpoint to check active streams and pending generations",
      },
    },
    async (request, reply) => {
      const activeStreamsInfo = Array.from(global.activeStreams.entries()).map(([key, info]) => ({
        streamKey: key,
        conversationId: info.conversationId,
        messageId: info.messageId,
        userId: info.userId,
        createdAt: info.createdAt,
        isActive: info.isActive,
        streamDestroyed: info.stream.destroyed,
      }))

      const pendingGenerationsInfo = Array.from(global.pendingGenerations.entries()).map(([key, info]) => ({
        streamKey: key,
        prompt: info.prompt.substring(0, 100),
        timestamp: info.timestamp,
      }))

      reply.send({
        success: true,
        data: {
          activeStreams: activeStreamsInfo,
          pendingGenerations: pendingGenerationsInfo,
          totalActiveStreams: global.activeStreams.size,
          totalPendingGenerations: global.pendingGenerations.size,
        },
      })
    },
  )

  // Enhanced game generation function
  async function startGameGeneration(conversationId: string, messageId: string, prompt: string) {
    const streamKey = `${conversationId}:${messageId}`
    console.log(`🎮 Starting game generation for ${streamKey}`)
    console.log(`📝 Prompt: "${prompt}"`)

    const streamInfo = global.activeStreams.get(streamKey)
    if (!streamInfo || !streamInfo.isActive || streamInfo.stream.destroyed) {
      console.log(`❌ No active stream for ${streamKey}`)
      console.log(
        `📊 Stream info:`,
        streamInfo
          ? {
              isActive: streamInfo.isActive,
              destroyed: streamInfo.stream.destroyed,
              createdAt: streamInfo.createdAt,
            }
          : "null",
      )
      return
    }

    let livePreviewUrl: string | null = null // Store the live URL

    const sendUpdate = (data: any) => {
      const currentStreamInfo = global.activeStreams.get(streamKey)
      if (currentStreamInfo && currentStreamInfo.isActive && !currentStreamInfo.stream.destroyed) {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`
          currentStreamInfo.stream.write(message)
          console.log(`📤 Sent ${data.type} to ${streamKey}`)
        } catch (error) {
          console.error(`❌ Failed to send update to ${streamKey}:`, error)
          // Mark stream as inactive
          currentStreamInfo.isActive = false
        }
      } else {
        console.log(`⚠️ Stream ${streamKey} is no longer active, skipping update`)
      }
    }

    try {
      console.log(`🚀 Calling external API: POST localhost:3001/api/generate/simple`)
      console.log(`📦 Request body: { "prompt": "${prompt}" }`)

      // Send initial status
      sendUpdate({
        type: "generation_started",
        message: "Starting game generation with external API...",
        timestamp: new Date().toISOString(),
      })

      const files = await externalGameAPI.generateGame(prompt, (updateData) => {
        // Capture the live URL when we receive the complete event
        if (updateData.type === "complete" && updateData.liveUrl) {
          livePreviewUrl = updateData.liveUrl
          console.log(`🌐 Captured live preview URL: ${livePreviewUrl}`)
        }
        // Forward all updates to the client
        sendUpdate(updateData)
      })

      console.log(`✅ External API returned ${files.length} files`)

      // Log the files we received for debugging
      files.forEach((file, index) => {
        console.log(`📄 Collected file ${index + 1}: ${file.path} (${file.type}) - ${file.content.length} chars`)
      })

      // Save game response to database
      const gameResponse: Omit<GameResponse, "version" | "createdAt"> = {
        prompt,
        files,
        status: "completed",
        metadata: {
          gameType: "HTML5 Canvas Game",
          framework: "Vanilla JavaScript",
          features: ["Game Loop", "Input Handling", "Canvas Rendering"],
        },
      }

      await conversationModel.addGameResponse(conversationId, messageId, gameResponse)
      console.log(`💾 Game response saved to database`)

      // Send final completion event with the live URL
      sendUpdate({
        type: "generation_complete",
        progress: 100,
        message: "Game generation completed successfully!",
        filesCount: files.length,
        previewUrl: livePreviewUrl || `/api/conversations/${conversationId}/preview`, // Use live URL if available
        liveUrl: livePreviewUrl, // Also send as separate field
      })

      console.log(`✅ Game generation completed for ${streamKey}`)
    } catch (error) {
      console.error(`❌ Game generation failed for ${streamKey}:`, error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      sendUpdate({
        type: "error",
        error: errorMessage,
        details: "The external game generation API encountered an error.",
      })

      // Save error response to database
      const errorResponse: Omit<GameResponse, "version" | "createdAt"> = {
        prompt,
        files: [],
        status: "error",
        error: errorMessage,
      }
      await conversationModel.addGameResponse(conversationId, messageId, errorResponse)
    } finally {
      // Always close the stream
      const finalStreamInfo = global.activeStreams.get(streamKey)
      if (finalStreamInfo && finalStreamInfo.isActive && !finalStreamInfo.stream.destroyed) {
        try {
          finalStreamInfo.stream.write(`data: ${JSON.stringify({ type: "end" })}\n\n`)
          finalStreamInfo.stream.end()
          console.log(`🔚 Stream closed for ${streamKey}`)
        } catch (error) {
          console.error(`❌ Failed to close stream ${streamKey}:`, error)
        }
      }

      // Clean up
      global.activeStreams.delete(streamKey)
      global.pendingGenerations.delete(streamKey)
    }
  }
}
