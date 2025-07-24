import type { FastifyInstance } from "fastify"
import { ConversationModel } from "../models/Conversation"
import { ExternalGameAPI } from "../services/ExternalGameAPI"
import type { AuthPayload, MessageContent, GameResponse } from "../types"
import multipart from "@fastify/multipart"
import type { Writable } from "stream"

// Global stream storage
declare global {
  var activeStreams: Map<string, Writable> | undefined
}
if (!global.activeStreams) {
  global.activeStreams = new Map()
}

export async function conversationRoutes(fastify: FastifyInstance) {
  await fastify.register(multipart)

  const conversationModel = new ConversationModel()
  const externalGameAPI = new ExternalGameAPI()

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
        description: "List all conversations for the authenticated user",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const { userId } = request.user as AuthPayload
      const conversations = await conversationModel.findByUserId(userId)
      reply.send({
        success: true,
        data: conversations,
      })
    },
  )

  // Get single conversation
  fastify.get<{ Params: { conversationId: string } }>(
    "/:conversationId",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Conversations"],
        description: "Get a single conversation with complete message history",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const { conversationId } = request.params
      const conversation = await conversationModel.findById(conversationId)

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

        reply.code(201).send({
          success: true,
          data: {
            messageId: userMessage._id.toString(),
            conversationId,
            streamUrl: `/api/conversations/${conversationId}/messages/${userMessage._id}/stream`,
          },
          message: "Message sent successfully. Connect to streamUrl for real-time generation updates.",
        })

        // Start game generation asynchronously
        setTimeout(() => {
          startGameGeneration(conversationId, userMessage._id.toString(), messageText).catch((error) => {
            console.error(`❌ Game generation failed for message ${userMessage._id}:`, error)
          })
        }, 100)
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

  // Server-Sent Events streaming endpoint
  fastify.get<{ Params: { conversationId: string; messageId: string } }>(
    "/:conversationId/messages/:messageId/stream",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Messages"],
        description: "Real-Time Game Generation Stream using External API",
        security: [{ bearerAuth: [] }],
        produces: ["text/event-stream"],
      },
    },
    async (request, reply) => {
      const { conversationId, messageId } = request.params
      const { userId } = request.user as AuthPayload

      const conversation = await conversationModel.findById(conversationId)
      if (!conversation || conversation.userId.toString() !== userId) {
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
      global.activeStreams.set(streamKey, reply.raw)

      // Send initial connection confirmation
      reply.raw.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`)

      // Clean up on client disconnect
      request.raw.on("close", () => {
        console.log(`🔌 Client disconnected ${streamKey}`)
        global.activeStreams.delete(streamKey)
      })

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        if (reply.raw && !reply.raw.destroyed) {
          reply.raw.write(`data: ${JSON.stringify({ type: "ping", timestamp: new Date().toISOString() })}\n\n`)
        } else {
          clearInterval(pingInterval)
        }
      }, 30000)

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
        description: "Delete an entire conversation",
        security: [{ bearerAuth: [] }],
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

  // Game generation function
  async function startGameGeneration(conversationId: string, messageId: string, prompt: string) {
    const streamKey = `${conversationId}:${messageId}`
    console.log(`🎮 Starting game generation for ${streamKey}`)

    const stream = global.activeStreams.get(streamKey)
    if (!stream || stream.destroyed) {
      console.log(`❌ No active stream for ${streamKey}`)
      return
    }

    const sendUpdate = (data: any) => {
      if (stream && !stream.destroyed) {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`
          stream.write(message)
          console.log(`📤 Sent ${data.type} to ${streamKey}`)
        } catch (error) {
          console.error(`❌ Failed to send update to ${streamKey}:`, error)
        }
      }
    }

    try {
      const files = await externalGameAPI.generateGame(prompt, sendUpdate)

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
      if (stream && !stream.destroyed) {
        try {
          stream.write(`data: ${JSON.stringify({ type: "end" })}\n\n`)
          stream.end()
          console.log(`🔚 Stream closed for ${streamKey}`)
        } catch (error) {
          console.error(`❌ Failed to close stream ${streamKey}:`, error)
        }
      }
      global.activeStreams.delete(streamKey)
    }
  }
}
