import type { FastifyInstance } from "fastify"
import { ConversationModel } from "../models/Conversation"
import { AttachmentModel } from "../models/Attachment"
import { LLMService } from "../services/llm/LLMService"
import { CodeCompiler } from "../services/CodeCompiler"
import type { AuthPayload, MessageContent, LLMResponse, CodeFile } from "../types"
import multipart from "@fastify/multipart"

export async function conversationRoutes(fastify: FastifyInstance) {
  await fastify.register(multipart)

  const conversationModel = new ConversationModel()
  const attachmentModel = new AttachmentModel()
  const llmService = new LLMService()
  const codeCompiler = new CodeCompiler()

  // --- Conversation Management ---

  // Create new conversation
  fastify.post<{ Body: { title: string } }>(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Conversations"],
        description: "Create a new conversation",
        security: [{ bearerAuth: [] }],
        body: {
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
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  _id: { type: "string", example: "507f1f77bcf86cd799439012" },
                  title: { type: "string", example: "Space Shooter with Power-ups and Boss Battles" },
                  userId: { type: "string", example: "507f1f77bcf86cd799439011" },
                  messages: { type: "array", items: {}, example: [] },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string", example: "Conversation created successfully" },
            },
          },
          401: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "Unauthorized" },
              message: { type: "string", example: "Authentication required" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.user as AuthPayload
      const { title } = request.body
      const conversation = await conversationModel.create(userId, title)
      reply.code(201).send({
        success: true,
        data: conversation,
        message: "Conversation created successfully",
      })
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
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    _id: { type: "string", example: "507f1f77bcf86cd799439012" },
                    title: { type: "string", example: "Space Shooter with Power-ups and Boss Battles" },
                    updatedAt: { type: "string", format: "date-time" },
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
      const conversations = await conversationModel.findByUserId(userId)
      reply.send({
        success: true,
        data: conversations,
      })
    },
  )

  // Get single conversation with all messages
  fastify.get<{ Params: { conversationId: string } }>(
    "/:conversationId",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Conversations"],
        description: "Get a single conversation with all messages and attachments",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            conversationId: { type: "string", description: "Conversation ID" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  userId: { type: "string" },
                  title: { type: "string" },
                  messages: { type: "array", items: {} },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "Not Found" },
              message: { type: "string", example: "Conversation not found" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { conversationId } = request.params
      const conversation = await conversationModel.findById(conversationId)

      if (!conversation || conversation.userId.toString() !== (request.user as AuthPayload).userId) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Conversation not found",
        })
      }

      // Load attachments for each message
      for (const message of conversation.messages) {
        message.attachments = await attachmentModel.findByMessageId(message._id.toString())
      }

      reply.send({
        success: true,
        data: conversation,
      })
    },
  )

  // --- Message Management ---

  // Add message with optional attachments
  fastify.post<{ Params: { conversationId: string } }>(
    "/:conversationId/messages",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Messages"],
        description: "Add a new message to conversation with optional file attachments",
        security: [{ bearerAuth: [] }],
        consumes: ["multipart/form-data"],
        params: {
          type: "object",
          properties: {
            conversationId: { type: "string", description: "Conversation ID" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  conversationId: { type: "string" },
                  role: { type: "string", enum: ["user", "assistant"] },
                  content: { type: "array", items: {} },
                  attachments: { type: "array", items: {} },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string", example: "Message sent successfully. AI response is being generated..." },
            },
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "Not Found" },
              message: { type: "string", example: "Conversation not found" },
            },
          },
          400: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "Bad Request" },
              message: { type: "string", example: "Message text is required" },
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
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Conversation not found",
        })
      }

      // Parse multipart form data
      const parts = request.parts()
      let messageText = ""
      const attachments: any[] = []

      for await (const part of parts) {
        if (part.type === "field" && part.fieldname === "text") {
          messageText = part.value as string
        } else if (part.type === "file") {
          // Upload file to GridFS
          const uploadStream = attachmentModel.getUploadStream(part.filename || "unknown")
          await part.file.pipe(uploadStream)

          attachments.push({
            filename: part.filename,
            mimetype: part.mimetype,
            size: part.file.bytesRead,
            gridfsId: uploadStream.id,
          })
        }
      }

      if (!messageText.trim()) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Message text is required",
        })
      }

      // Create user message
      const messageContent: MessageContent = {
        version: 1,
        text: messageText,
        editedAt: new Date(),
      }

      const updatedConversation = await conversationModel.addMessage(conversationId, {
        conversationId: conversation._id!,
        role: "user",
        content: [messageContent],
        attachments: [],
      })

      if (!updatedConversation) {
        return reply.code(500).send({
          success: false,
          error: "Internal Server Error",
          message: "Failed to add message",
        })
      }

      const userMessage = updatedConversation.messages[updatedConversation.messages.length - 1]

      // Save attachments linked to message
      for (const attachment of attachments) {
        await attachmentModel.create(
          userMessage._id.toString(),
          attachment.filename,
          attachment.filename,
          attachment.mimetype,
          attachment.size,
          attachment.gridfsId,
        )
      }

      // Generate LLM response with verification asynchronously
      setImmediate(async () => {
        try {
          // Prepare context with attachments
          const attachmentContext = await Promise.all(
            attachments.map(async (att) => ({
              filename: att.filename,
              content: "File content would be extracted here", // TODO: Extract file content
            })),
          )

          // Use enhanced service with self-correction
          const llmResponseText = await llmService.generateCode(messageText, {
            framework: "phaser.js", // Focus on Phaser.js
            attachments: attachmentContext,
          })

          // Parse structured response
          const parsedResponse = JSON.parse(llmResponseText)

          const llmResponse: Omit<LLMResponse, "version" | "createdAt"> = {
            provider: "groq",
            textResponse: parsedResponse.textResponse || "Response generated",
            codeResponse: parsedResponse.codeResponse,
            thinking: parsedResponse.thinking,
            status: parsedResponse.codeResponse?.status === "verified" ? "completed" : "error",
          }

          await conversationModel.addLLMResponse(conversationId, userMessage._id.toString(), llmResponse)
        } catch (error) {
          console.error("LLM generation failed:", error)

          const errorResponse: Omit<LLMResponse, "version" | "createdAt"> = {
            provider: "groq",
            textResponse: "Sorry, I encountered an error generating the response.",
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          }

          await conversationModel.addLLMResponse(conversationId, userMessage._id.toString(), errorResponse)
        }
      })

      reply.code(201).send({
        success: true,
        data: userMessage,
        message: "Message sent successfully. AI response is being generated...",
      })
    },
  )

  // Edit a message (creates new version)
  fastify.put<{ Params: { conversationId: string; messageId: string }; Body: { text: string } }>(
    "/:conversationId/messages/:messageId",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Messages"],
        description: "Edit a message (creates a new version)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            conversationId: { type: "string" },
            messageId: { type: "string" },
          },
        },
        body: {
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
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  content: { type: "array", items: {} },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "Not Found" },
              message: { type: "string", example: "Conversation or message not found" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { conversationId, messageId } = request.params
      const { text } = request.body
      const { userId } = request.user as AuthPayload

      const conversation = await conversationModel.findById(conversationId)
      if (!conversation || conversation.userId.toString() !== userId) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Conversation not found",
        })
      }

      const updatedConversation = await conversationModel.editMessageContent(conversationId, messageId, text)
      if (!updatedConversation) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Message not found",
        })
      }

      reply.send({
        success: true,
        data: updatedConversation,
      })
    },
  )

  // Get message attachments
  fastify.get<{ Params: { conversationId: string; messageId: string } }>(
    "/:conversationId/messages/:messageId/attachments",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Messages"],
        description: "Get all attachments for a message",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    _id: { type: "string" },
                    messageId: { type: "string" },
                    filename: { type: "string" },
                    originalName: { type: "string" },
                    mimetype: { type: "string" },
                    size: { type: "integer" },
                    uploadedAt: { type: "string", format: "date-time" },
                    downloadUrl: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { conversationId, messageId } = request.params
      const { userId } = request.user as AuthPayload

      const conversation = await conversationModel.findById(conversationId)
      if (!conversation || conversation.userId.toString() !== userId) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Conversation not found",
        })
      }

      const attachments = await attachmentModel.findByMessageId(messageId)
      reply.send({
        success: true,
        data: attachments,
      })
    },
  )

  // Download attachment
  fastify.get<{ Params: { conversationId: string; messageId: string; attachmentId: string } }>(
    "/:conversationId/messages/:messageId/attachments/:attachmentId",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Messages"],
        description: "Download a message attachment",
        security: [{ bearerAuth: [] }],
        produces: ["application/octet-stream"],
      },
    },
    async (request, reply) => {
      const { conversationId, attachmentId } = request.params
      const { userId } = request.user as AuthPayload

      const conversation = await conversationModel.findById(conversationId)
      if (!conversation || conversation.userId.toString() !== userId) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Conversation not found",
        })
      }

      const attachment = await attachmentModel.findById(attachmentId)
      if (!attachment) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Attachment not found",
        })
      }

      const downloadStream = attachmentModel.getDownloadStream(attachment.gridfsId)

      reply.type(attachment.mimetype)
      reply.header("Content-Disposition", `attachment; filename="${attachment.originalName}"`)
      reply.send(downloadStream)
    },
  )
}

function parseCodeIntoFiles(codeContent: string, framework: string): CodeFile[] {
  try {
    const parsed = JSON.parse(codeContent)
    if (parsed.codeResponse && parsed.codeResponse.files) {
      return parsed.codeResponse.files
    }
  } catch (error) {
    console.log("Failed to parse structured response, extracting code blocks...")
  }

  // Fallback: extract code from markdown blocks
  const codeBlocks = codeContent.match(/```[\w]*\n([\s\S]*?)\n```/g) || []
  return codeBlocks.map((block, index) => {
    const langMatch = block.match(/```(\w+)/)
    const language = langMatch ? langMatch[1] : "javascript"
    const code = block.replace(/```[\w]*\n/, "").replace(/\n```$/, "")

    let extension = "js"
    let type = "js" as any

    if (language === "tsx" || code.includes("JSX") || code.includes("<")) {
      extension = "tsx"
      type = "tsx"
    } else if (language === "typescript" || language === "ts") {
      extension = "ts"
      type = "ts"
    } else if (language === "css") {
      extension = "css"
      type = "css"
    } else if (language === "html") {
      extension = "html"
      type = "html"
    }

    return {
      path: `game-${index + 1}.${extension}`,
      content: code,
      type,
      language: language === "tsx" ? "typescript" : language,
    }
  })
}
