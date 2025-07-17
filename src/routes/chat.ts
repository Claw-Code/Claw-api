import type { FastifyInstance } from "fastify"
import { ChatModel } from "../models/Chat"
import { LLMService } from "../services/llm/LLMService"
import { CodeCompiler } from "../services/CodeCompiler"
import type { AuthPayload } from "../types"

export async function chatRoutes(fastify: FastifyInstance) {
  const chatModel = new ChatModel()
  const llmService = new LLMService()
  const codeCompiler = new CodeCompiler()

  // --- Chat Management ---

  // Create new chat
  fastify.post<{ Body: { title: string } }>(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Chat"],
        description: "Create a new chat session. The title is the first prompt.",
        body: {
          type: "object",
          required: ["title"],
          properties: { title: { type: "string", minLength: 1 } },
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.user as AuthPayload
      const { title } = request.body
      const chat = await chatModel.create(userId, title)
      reply.code(201).send(chat)
    },
  )

  // List all chats for a user
  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Chat"],
        description: "List all chat sessions for the authenticated user (titles only).",
      },
    },
    async (request, reply) => {
      const { userId } = request.user as AuthPayload
      const chats = await chatModel.findByUserId(userId)
      reply.send(chats)
    },
  )

  // Get a single chat with all messages
  fastify.get<{ Params: { chatId: string } }>(
    "/:chatId",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Chat"],
        description: "Fetch a single chat session with its full conversation history.",
      },
    },
    async (request, reply) => {
      const { chatId } = request.params
      const chat = await chatModel.findById(chatId)
      // Basic authorization check
      if (!chat || chat.userId.toString() !== (request.user as AuthPayload).userId) {
        return reply.code(404).send({ error: "Not Found", message: "Chat not found or access denied." })
      }
      reply.send(chat)
    },
  )

  // --- Message Management ---

  // Add a new message to a chat
  fastify.post<{ Params: { chatId: string }; Body: { text: string } }>(
    "/:chatId/messages",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Chat"],
        description: "Add a new user message to a chat. This will trigger an LLM response.",
      },
    },
    async (request, reply) => {
      const { chatId } = request.params
      const { text } = request.body
      const chat = await chatModel.findById(chatId)
      if (!chat || chat.userId.toString() !== (request.user as AuthPayload).userId) {
        return reply.code(404).send({ error: "Not Found", message: "Chat not found or access denied." })
      }

      // Add user message
      await chatModel.addMessage(chatId, {
        role: "user",
        content: [{ version: 1, text, createdAt: new Date() }],
      })

      // Trigger LLM response (this could be a separate async job)
      const llmThinking = "Thinking about how to generate the best code for this request..."
      const generatedCodeContent = await llmService.generateCode(text, { framework: "next.js" })
      const files = parseCodeIntoFiles(generatedCodeContent, "next.js")

      const response = await chatModel.addAssistantResponse(chatId, {
        text: "Here is the code you requested. It supports **Markdown**!",
        thinking: llmThinking,
        code: {
          files,
          framework: "next.js",
          status: "generating",
        },
      })

      reply.code(201).send(response)
    },
  )

  // Edit a user message
  fastify.put<{ Params: { chatId: string; messageId: string }; Body: { text: string } }>(
    "/:chatId/messages/:messageId",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Chat"],
        description: "Edit a user's message. This creates a new version of the content.",
      },
    },
    async (request, reply) => {
      const { chatId, messageId } = request.params
      const { text } = request.body
      const chat = await chatModel.findById(chatId)
      if (!chat || chat.userId.toString() !== (request.user as AuthPayload).userId) {
        return reply.code(404).send({ error: "Not Found", message: "Chat not found or access denied." })
      }

      const updatedChat = await chatModel.editUserMessage(chatId, messageId, text)
      if (!updatedChat) {
        return reply.code(404).send({ error: "Not Found", message: "Message not found." })
      }
      reply.send(updatedChat)
    },
  )
}

// Helper function (can be moved to a utility file)
function parseCodeIntoFiles(codeContent: string, framework: string): any[] {
  // Dummy implementation
  return [{ path: "index.tsx", content: codeContent, type: "tsx" }]
}
