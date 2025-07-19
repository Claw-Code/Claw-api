import type { FastifyInstance } from "fastify"
import { ConversationModel } from "../models/Conversation"
import { AttachmentModel } from "../models/Attachment"
import { LLMService } from "../services/llm/LLMService"
import { CodeCompiler } from "../services/CodeCompiler"
import type { AuthPayload, MessageContent, LLMResponse } from "../types"
import multipart from "@fastify/multipart"
import type { Writable } from "stream"

// Global stream storage (in production, use Redis Pub/Sub)
declare global {
  var activeStreams: Map<string, Writable> | undefined
}
if (!global.activeStreams) {
  global.activeStreams = new Map()
}

export async function conversationRoutes(fastify: FastifyInstance) {
  await fastify.register(multipart)

  const conversationModel = new ConversationModel()
  const attachmentModel = new AttachmentModel()
  const llmService = new LLMService()
  const codeCompiler = new CodeCompiler()

  // --- CONVERSATION MANAGEMENT ---

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
            description: "Conversation created successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
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
              message: { type: "string" },
            },
          },
          400: {
            description: "Invalid request data",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
              message: { type: "string" },
            },
          },
          401: {
            description: "Authentication required",
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
        description: "List all conversations for the authenticated user (summary view)",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "List of user's conversations",
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
        description: "Get a single conversation with complete message history and attachments",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            conversationId: { type: "string", description: "The conversation ID" },
          },
        },
        response: {
          200: {
            description: "Complete conversation with all messages",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  userId: { type: "string" },
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
                              version: { type: "integer" },
                              text: { type: "string" },
                              editedAt: { type: "string", format: "date-time" },
                            },
                          },
                        },
                        llmResponse: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              version: { type: "integer" },
                              provider: { type: "string" },
                              textResponse: { type: "string" },
                              thinking: { type: "string" },
                              codeResponse: {
                                type: "object",
                                properties: {
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
                                  framework: { type: "string" },
                                  language: { type: "string" },
                                  previewUrl: { type: "string" },
                                  downloadUrl: { type: "string" },
                                },
                              },
                              status: { type: "string", enum: ["generating", "completed", "error", "verified"] },
                              error: { type: "string" },
                              createdAt: { type: "string", format: "date-time" },
                            },
                          },
                        },
                        attachments: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              _id: { type: "string" },
                              filename: { type: "string" },
                              mimetype: { type: "string" },
                              size: { type: "integer" },
                            },
                          },
                        },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          404: {
            description: "Conversation not found or access denied",
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
      const conversation = await conversationModel.findById(conversationId)

      if (!conversation || conversation.userId.toString() !== (request.user as AuthPayload).userId) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Conversation not found or access denied",
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

  // --- MESSAGE MANAGEMENT & STREAMING ---

  // Send message and initiate streaming generation
  fastify.post<{ Params: { conversationId: string } }>(
    "/:conversationId/messages",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Messages"],
        description: `Send a message to initiate AI game generation with real-time streaming.

**Workflow:**
1. Send this POST request with your game prompt
2. Receive a streamUrl in the response
3. Connect to the streamUrl using EventSource for real-time updates
4. Receive live updates as the AI generates your game

**File Attachments:**
- Up to 5 files per message
- Max 50MB total size
- Supported: images, code files, documents
- Used as context for game generation`,
        security: [{ bearerAuth: [] }],
        consumes: ["multipart/form-data"],
        params: {
          type: "object",
          properties: {
            conversationId: { type: "string", description: "The conversation ID" },
          },
        },
        response: {
          201: {
            description: "Message created and stream initiated successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  messageId: { type: "string", description: "The ID of the created user message" },
                  conversationId: { type: "string", description: "The conversation ID" },
                  streamUrl: {
                    type: "string",
                    description: "Connect to this URL with EventSource for real-time updates",
                  },
                },
              },
              message: { type: "string" },
            },
          },
          400: {
            description: "Invalid request data",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
              message: { type: "string" },
            },
          },
          404: {
            description: "Conversation not found",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
              message: { type: "string" },
            },
          },
          413: {
            description: "File too large",
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
      console.log(`🔍 DEBUG: POST /messages called for conversation ${request.params.conversationId}`)

      const { conversationId } = request.params
      const { userId } = request.user as AuthPayload

      console.log(`🔍 DEBUG: User ID: ${userId}, Conversation ID: ${conversationId}`)

      try {
        const conversation = await conversationModel.findById(conversationId)
        console.log(`🔍 DEBUG: Conversation found: ${!!conversation}`)
        console.log(`🔍 DEBUG: Conversation title: ${conversation?.title}`)
        console.log(`🔍 DEBUG: Conversation userId: ${conversation?.userId}`)
        console.log(`🔍 DEBUG: Conversation messages exists: ${!!conversation?.messages}`)
        console.log(`🔍 DEBUG: Conversation messages is array: ${Array.isArray(conversation?.messages)}`)
        console.log(`🔍 DEBUG: Conversation messages length: ${conversation?.messages?.length || 0}`)

        if (!conversation || conversation.userId.toString() !== userId) {
          console.log(
            `🔍 DEBUG: Access denied - conversation userId: ${conversation?.userId}, request userId: ${userId}`,
          )
          return reply.code(404).send({
            success: false,
            error: "Not Found",
            message: "Conversation not found or access denied",
          })
        }

        console.log(`🔍 DEBUG: Starting to process multipart data...`)
        const parts = request.parts()
        let messageText = ""
        let framework = "phaser.js"
        const attachments: any[] = []

        console.log(`🔍 DEBUG: Processing parts...`)
        for await (const part of parts) {
          console.log(`🔍 DEBUG: Processing part type: ${part.type}, fieldname: ${part.fieldname}`)

          if (part.type === "field") {
            if (part.fieldname === "text") {
              messageText = part.value as string
              console.log(`🔍 DEBUG: Message text length: ${messageText.length}`)
            } else if (part.fieldname === "framework") {
              framework = part.value as string
              console.log(`🔍 DEBUG: Framework: ${framework}`)
            }
          } else if (part.type === "file") {
            console.log(`🔍 DEBUG: Processing file: ${part.filename}`)
            const uploadStream = attachmentModel.getUploadStream(part.filename || "unknown")
            await part.file.pipe(uploadStream)
            attachments.push({
              filename: part.filename,
              mimetype: part.mimetype,
              size: part.file.bytesRead,
              gridfsId: uploadStream.id,
            })
            console.log(`🔍 DEBUG: File processed: ${part.filename}`)
          }
        }

        console.log(`🔍 DEBUG: Parts processing complete. Message text: "${messageText.substring(0, 100)}..."`)

        if (!messageText.trim()) {
          console.log(`🔍 DEBUG: Empty message text, returning 400`)
          return reply.code(400).send({
            success: false,
            error: "ValidationError",
            message: "Message text is required",
          })
        }

        console.log(`🔍 DEBUG: Creating message content...`)
        const messageContent: MessageContent = {
          version: 1,
          text: messageText,
          editedAt: new Date(),
        }

        console.log(`🔍 DEBUG: About to call addMessage with:`)
        console.log(`🔍 DEBUG: - conversationId: ${conversationId}`)
        console.log(`🔍 DEBUG: - role: user`)
        console.log(`🔍 DEBUG: - content array length: ${[messageContent].length}`)

        // Test: Re-fetch conversation right before adding message
        const preTestConversation = await conversationModel.findById(conversationId)
        console.log(`🔍 DEBUG: Pre-test conversation exists: ${!!preTestConversation}`)
        console.log(`🔍 DEBUG: Pre-test conversation messages: ${preTestConversation?.messages?.length || 0}`)

        console.log(`🔍 DEBUG: Adding message to conversation...`)
        const updatedConversation = await conversationModel.addMessage(conversationId, {
          conversationId: conversation._id!,
          role: "user",
          content: [messageContent],
        })

        console.log(`🔍 DEBUG: Message added. Updated conversation exists: ${!!updatedConversation}`)
        console.log(`🔍 DEBUG: Messages array exists: ${!!updatedConversation?.messages}`)
        console.log(`🔍 DEBUG: Messages array length: ${updatedConversation?.messages?.length || 0}`)
        console.log(`🔍 DEBUG: updatedConversation is null: ${updatedConversation === null}`)
        console.log(`🔍 DEBUG: messages is null/undefined: ${updatedConversation?.messages == null}`)
        console.log(`🔍 DEBUG: messages length is 0: ${updatedConversation?.messages?.length === 0}`)

        // Additional debugging - let's see what properties the updatedConversation actually has
        if (updatedConversation) {
          console.log(`🔍 DEBUG: updatedConversation keys: ${Object.keys(updatedConversation)}`)
          console.log(`🔍 DEBUG: updatedConversation._id: ${updatedConversation._id}`)
          console.log(`🔍 DEBUG: updatedConversation.title: ${updatedConversation.title}`)
          console.log(`🔍 DEBUG: typeof messages: ${typeof updatedConversation.messages}`)

          // Try to manually fetch the conversation again to see if it was actually updated
          const postTestConversation = await conversationModel.findById(conversationId)
          console.log(`🔍 DEBUG: Post-test conversation messages: ${postTestConversation?.messages?.length || 0}`)
        }

        if (!updatedConversation || !updatedConversation.messages || updatedConversation.messages.length === 0) {
          console.log(`🔍 DEBUG: Failed to add message - returning 500`)
          return reply.code(500).send({
            success: false,
            error: "InternalServerError",
            message: "Failed to add message",
          })
        }

        const userMessage = updatedConversation.messages[updatedConversation.messages.length - 1]
        console.log(`🔍 DEBUG: User message ID: ${userMessage._id}`)

        // Save attachments
        console.log(`🔍 DEBUG: Saving ${attachments.length} attachments...`)
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

        console.log(`🔍 DEBUG: Sending success response...`)
        reply.code(201).send({
          success: true,
          data: {
            messageId: userMessage._id.toString(),
            conversationId,
            streamUrl: `/api/conversations/${conversationId}/messages/${userMessage._id}/stream`,
          },
          message: "Message sent successfully. Connect to streamUrl for real-time generation updates.",
        })

        // Start streaming generation asynchronously with better error handling
        console.log(`🚀 STREAM: Starting generation for message ${userMessage._id}`)

        // Use setTimeout instead of setImmediate for better error handling
        setTimeout(() => {
          console.log(`🚀 STREAM: Timeout triggered, calling startStreamingGeneration...`)
          startStreamingGeneration(
            conversationId,
            userMessage._id.toString(),
            messageText,
            framework,
            attachments,
          ).catch((error) => {
            console.error(`❌ STREAM: Generation failed for message ${userMessage._id}:`, error)

            // Try to send error to stream if still active
            const streamKey = `${conversationId}:${userMessage._id}`
            const stream = global.activeStreams.get(streamKey)
            if (stream && !stream.destroyed) {
              try {
                stream.write(
                  `data: ${JSON.stringify({
                    type: "error",
                    error: "Generation failed",
                    details: error.message,
                  })}\n\n`,
                )
                stream.write(`data: ${JSON.stringify({ type: "end" })}\n\n`)
                stream.end()
              } catch (streamError) {
                console.error("Failed to send error to stream:", streamError)
              }
            }
          })
        }, 100) // Small delay to ensure response is sent first
      } catch (error) {
        console.error(`❌ DEBUG: Unhandled error in POST /messages:`, error)
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
        description: `Real-Time Game Generation Stream

Connect to this endpoint using EventSource to receive live updates during game generation.

**Connection Example:**
\`\`\`javascript
const eventSource = new EventSource('/api/conversations/{conversationId}/messages/{messageId}/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type, data);
};
\`\`\`

**Stream Events (in order):**

1. **thinking** - AI is analyzing your request
2. **thinking_detail** - Detailed analysis phase  
3. **text_start** - Documentation generation begins
4. **text_chunk** - Streaming documentation content
5. **code_start** - Code generation begins
6. **file_start** - New file generation starts
7. **file_chunk** - Streaming file content
8. **file_complete** - File generation finished
9. **verification** - Code quality verification
10. **preview_start** - Live preview build starting
11. **preview_ready** - Live preview available
12. **download_ready** - ZIP download available
13. **generation_complete** - All generation finished
14. **complete** - Final response with all data
15. **end** - Stream closing

**Error Events:**
- **error** - Something went wrong
- **preview_error** - Preview build failed

**Keep-Alive:**
- **ping** - Connection keep-alive (ignore)`,
        security: [{ bearerAuth: [] }],
        produces: ["text/event-stream"],
        params: {
          type: "object",
          properties: {
            conversationId: { type: "string", description: "The conversation ID" },
            messageId: { type: "string", description: "The message ID from the POST response" },
          },
        },
        responses: {
          200: {
            description: "Server-Sent Events stream established",
            headers: {
              "Content-Type": { schema: { type: "string" } },
              "Cache-Control": { schema: { type: "string" } },
              Connection: { schema: { type: "string" } },
            },
          },
          404: {
            description: "Conversation or message not found",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { conversationId, messageId } = request.params
      const { userId } = request.user as AuthPayload

      console.log(`🔌 STREAM: Client connecting to stream ${conversationId}:${messageId}`)

      const conversation = await conversationModel.findById(conversationId)
      if (!conversation || conversation.userId.toString() !== userId) {
        console.log(`❌ STREAM: Access denied for ${conversationId}:${messageId}`)
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

      console.log(`✅ STREAM: Stream registered ${streamKey}`)

      // Send initial connection confirmation
      reply.raw.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`)

      // Clean up on client disconnect
      request.raw.on("close", () => {
        console.log(`🔌 STREAM: Client disconnected ${streamKey}`)
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

  // Edit a message (creates new version)
  fastify.put<{ Params: { conversationId: string; messageId: string }; Body: { text: string } }>(
    "/:conversationId/messages/:messageId",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Messages"],
        description: "Edit a user message (creates a new version, preserving history)",
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
            },
          },
        },
        response: {
          200: {
            description: "Message updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  content: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        version: { type: "integer" },
                        text: { type: "string" },
                        editedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          404: {
            description: "Conversation or message not found",
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
      const { conversationId, messageId } = request.params
      const { text } = request.body
      const { userId } = request.user as AuthPayload

      const conversation = await conversationModel.findById(conversationId)
      if (!conversation || conversation.userId.toString() !== userId) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Conversation not found or access denied",
        })
      }

      const updatedConversation = await conversationModel.editMessageContent(conversationId, messageId, text)
      if (!updatedConversation) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Message not found or access denied",
        })
      }

      // Find the updated message
      const updatedMessage = updatedConversation.messages.find((m) => m._id.toString() === messageId)

      reply.send({
        success: true,
        data: {
          _id: updatedMessage?._id,
          content: updatedMessage?.content,
          updatedAt: updatedMessage?.updatedAt,
        },
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
        description: "Get all attachments for a specific message",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            conversationId: { type: "string" },
            messageId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "List of message attachments",
            type: "object",
            properties: {
              success: { type: "boolean" },
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
          message: "Conversation not found or access denied",
        })
      }

      const attachments = await attachmentModel.findByMessageId(messageId)

      // Add download URLs
      const attachmentsWithUrls = attachments.map((att) => ({
        ...att,
        downloadUrl: `/api/conversations/${conversationId}/messages/${messageId}/attachments/${att._id}`,
      }))

      reply.send({
        success: true,
        data: attachmentsWithUrls,
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
        description: "Download a specific message attachment",
        security: [{ bearerAuth: [] }],
        produces: ["application/octet-stream"],
        params: {
          type: "object",
          properties: {
            conversationId: { type: "string" },
            messageId: { type: "string" },
            attachmentId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "File download",
            type: "string",
            format: "binary",
          },
          404: {
            description: "Attachment not found",
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
      const { conversationId, attachmentId } = request.params
      const { userId } = request.user as AuthPayload

      const conversation = await conversationModel.findById(conversationId)
      if (!conversation || conversation.userId.toString() !== userId) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Conversation not found or access denied",
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

  // --- DELETE OPERATIONS ---

  // Delete a message
  fastify.delete<{ Params: { conversationId: string; messageId: string } }>(
    "/:conversationId/messages/:messageId",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Messages"],
        description: "Delete a specific message from a conversation. This action is irreversible.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            conversationId: { type: "string" },
            messageId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Message deleted successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          404: {
            description: "Conversation or message not found",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
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
        return reply.code(404).send({ success: false, error: "Not Found" })
      }

      const success = await conversationModel.deleteMessage(conversationId, messageId)
      if (success) {
        reply.send({ success: true, message: "Message deleted successfully" })
      } else {
        reply.code(404).send({ success: false, error: "Not Found", message: "Message not found" })
      }
    },
  )

  // Delete a conversation
  fastify.delete<{ Params: { conversationId: string } }>(
    "/:conversationId",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Conversations"],
        description: "Delete an entire conversation and all its messages. This action is irreversible.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            conversationId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Conversation deleted successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          404: {
            description: "Conversation not found",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
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

  // --- STREAMING GENERATION FUNCTION ---

  async function startStreamingGeneration(
    conversationId: string,
    messageId: string,
    prompt: string,
    framework: string,
    attachments: any[],
  ) {
    const streamKey = `${conversationId}:${messageId}`
    console.log(`🚀 STREAM: Starting generation for ${streamKey}`)

    const stream = global.activeStreams.get(streamKey)

    if (!stream || stream.destroyed) {
      console.log(`❌ STREAM: No active stream for ${streamKey}`)
      return
    }

    const sendUpdate = (data: any) => {
      if (stream && !stream.destroyed) {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`
          stream.write(message)
          console.log(`📤 STREAM: Sent ${data.type} to ${streamKey}`)
        } catch (error) {
          console.error(`❌ STREAM: Failed to send update to ${streamKey}:`, error)
        }
      } else {
        console.log(`⚠️ STREAM: Stream ${streamKey} is no longer active`)
      }
    }

    try {
      console.log(`🤖 STREAM: Preparing LLM generation for ${streamKey}`)

      // Prepare attachment context
      const attachmentContext = await Promise.all(
        attachments.map(async (att) => ({
          filename: att.filename,
          mimetype: att.mimetype,
          content: "File content would be extracted here", // In real implementation, extract actual content
        })),
      )

      console.log(`📝 STREAM: Calling LLM service for ${streamKey}`)

      // Generate code with streaming updates
      const llmResponseText = await llmService.generateCodeWithStreaming(
        prompt,
        { framework, attachments: attachmentContext },
        sendUpdate,
      )

      console.log(`✅ STREAM: LLM generation completed for ${streamKey}`)

      const parsedResponse = JSON.parse(llmResponseText)

      // Create live preview
      sendUpdate({ type: "preview_start", content: "🚀 Launching live preview environment..." })

      try {
        const previewEnv = await codeCompiler.compileAndPreview(parsedResponse.codeResponse)
        if (previewEnv.status === "ready") {
          parsedResponse.codeResponse.previewUrl = previewEnv.url
          sendUpdate({
            type: "preview_ready",
            url: previewEnv.url,
            buildLogs: previewEnv.buildLogs,
          })
        } else {
          sendUpdate({
            type: "preview_error",
            error: "Preview build failed",
            buildLogs: previewEnv.buildLogs,
          })
        }
      } catch (previewError) {
        console.error(`⚠️ STREAM: Preview failed for ${streamKey}:`, previewError)
        sendUpdate({
          type: "preview_error",
          error: previewError instanceof Error ? previewError.message : "Preview failed",
        })
      }

      // Generate download link
      try {
        const downloadUrl = await codeCompiler.generateDownloadLink(parsedResponse.codeResponse)
        parsedResponse.codeResponse.downloadUrl = downloadUrl
        sendUpdate({ type: "download_ready", url: downloadUrl })
      } catch (downloadError) {
        console.error(`⚠️ STREAM: Download generation failed for ${streamKey}:`, downloadError)
        // Continue without download link
      }

      // Send final completion
      sendUpdate({ type: "generation_complete", progress: 100 })
      sendUpdate({ type: "complete", response: parsedResponse })

      // Save to database
      const llmResponse: Omit<LLMResponse, "version" | "createdAt"> = {
        provider: "groq",
        textResponse: parsedResponse.textResponse,
        codeResponse: parsedResponse.codeResponse,
        thinking: parsedResponse.thinking,
        status: parsedResponse.status || "completed",
        error: parsedResponse.error,
      }
      await conversationModel.addLLMResponse(conversationId, messageId, llmResponse)

      console.log(`✅ STREAM: Generation completed and saved for ${streamKey}`)
    } catch (error) {
      console.error(`❌ STREAM: Generation failed for ${streamKey}:`, error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      sendUpdate({
        type: "error",
        error: errorMessage,
        details: "The AI generation process encountered an error. Please try again.",
      })

      // Save error response to database
      const errorResponse: Omit<LLMResponse, "version" | "createdAt"> = {
        provider: "groq",
        textResponse: "I apologize, but I encountered an error while generating your game.",
        status: "error",
        error: errorMessage,
      }
      await conversationModel.addLLMResponse(conversationId, messageId, errorResponse)
    } finally {
      // Always close the stream
      if (stream && !stream.destroyed) {
        try {
          stream.write(`data: ${JSON.stringify({ type: "end" })}\n\n`)
          stream.end()
          console.log(`🔚 STREAM: Stream closed for ${streamKey}`)
        } catch (error) {
          console.error(`❌ STREAM: Failed to close stream ${streamKey}:`, error)
        }
      }
      global.activeStreams.delete(streamKey)
    }
  }
}
