import type { FastifyInstance } from "fastify"
import { ChatModel } from "../models/Chat"
import { LLMService } from "../services/llm/LLMService"
import { CodeCompiler } from "../services/CodeCompiler"
<<<<<<< HEAD
<<<<<<< HEAD
import type { AuthPayload } from "../types"
=======
import { v4 as uuidv4 } from "uuid"
import type { Message, GeneratedCode, CodeFile } from "../types"
>>>>>>> d07d2a6 (Init API)
=======
import type { AuthPayload } from "../types"
>>>>>>> 19ce577 (convo fix and LLm tune)

export async function chatRoutes(fastify: FastifyInstance) {
  const chatModel = new ChatModel()
  const llmService = new LLMService()
  const codeCompiler = new CodeCompiler()

<<<<<<< HEAD
<<<<<<< HEAD
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
=======
=======
  // --- Chat Management ---

>>>>>>> 19ce577 (convo fix and LLm tune)
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
<<<<<<< HEAD
          required: ["userId", "title"],
          properties: {
            userId: { type: "string" },
            title: { type: "string" },
          },
>>>>>>> d07d2a6 (Init API)
=======
          required: ["title"],
          properties: { title: { type: "string", minLength: 1 } },
>>>>>>> 19ce577 (convo fix and LLm tune)
        },
      },
    },
    async (request, reply) => {
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 19ce577 (convo fix and LLm tune)
      const { userId } = request.user as AuthPayload
      const { title } = request.body
      const chat = await chatModel.create(userId, title)
      reply.code(201).send(chat)
<<<<<<< HEAD
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
=======
      try {
        const { userId, title } = request.body as { userId: string; title: string }

        const chat = await chatModel.create({
          userId,
          title,
          messages: [],
        })

        reply.code(201).send({
          success: true,
          chat,
        })
      } catch (error) {
        reply.code(500).send({
          success: false,
          error: "Failed to create chat",
        })
      }
=======
>>>>>>> 19ce577 (convo fix and LLm tune)
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
<<<<<<< HEAD
>>>>>>> d07d2a6 (Init API)
=======
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
>>>>>>> 19ce577 (convo fix and LLm tune)
    },
  )
}

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 19ce577 (convo fix and LLm tune)
// Helper function (can be moved to a utility file)
function parseCodeIntoFiles(codeContent: string, framework: string): any[] {
  // Dummy implementation
  return [{ path: "index.tsx", content: codeContent, type: "tsx" }]
<<<<<<< HEAD
=======
function parseCodeIntoFiles(codeContent: string, framework: string): CodeFile[] {
  const files: CodeFile[] = []

  // Extract code blocks with file paths
  const fileRegex = /```(\w+)?\s*(?:file="([^"]+)")?\s*\n([\s\S]*?)```/g
  let match

  while ((match = fileRegex.exec(codeContent)) !== null) {
    const [, language, filePath, content] = match

    if (filePath && content) {
      const fileType = getFileType(filePath, language)
      files.push({
        path: filePath,
        content: content.trim(),
        type: fileType,
      })
    }
  }

  // If no files found, create default structure
  if (files.length === 0) {
    files.push({
      path: "pages/index.tsx",
      content: createDefaultComponent(codeContent, framework),
      type: "tsx",
    })
  }

  // Add necessary config files
  addConfigFiles(files, framework)

  return files
}

function getFileType(filePath: string, language?: string): CodeFile["type"] {
  const ext = filePath.split(".").pop()?.toLowerCase()

  switch (ext) {
    case "tsx":
      return "tsx"
    case "ts":
      return "ts"
    case "css":
      return "css"
    case "json":
      return "json"
    case "html":
      return "html"
    default:
      return language === "typescript" ? "ts" : "tsx"
  }
}

function createDefaultComponent(code: string, framework: string): string {
  return `import React from 'react';

export default function GeneratedComponent() {
  return (
    <div className="container mx-auto p-4">
      <h1>Generated Code</h1>
      <div>
        {/* Generated code will be integrated here */}
        <pre><code>${code.replace(/`/g, "\\`")}</code></pre>
      </div>
    </div>
  );
}`
}

function addConfigFiles(files: CodeFile[], framework: string): void {
  const hasPackageJson = files.some((f) => f.path === "package.json")
  const hasNextConfig = files.some((f) => f.path.includes("next.config"))
  const hasTsConfig = files.some((f) => f.path === "tsconfig.json")

  if (!hasNextConfig && framework.toLowerCase().includes("next")) {
    files.push({
      path: "next.config.js",
      content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig`,
      type: "ts",
    })
  }

  if (!hasTsConfig) {
    files.push({
      path: "tsconfig.json",
      content: JSON.stringify(
        {
          compilerOptions: {
            target: "es5",
            lib: ["dom", "dom.iterable", "es6"],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            forceConsistentCasingInFileNames: true,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "node",
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: "preserve",
            incremental: true,
            plugins: [{ name: "next" }],
            paths: { "@/*": ["./src/*"] },
          },
          include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
          exclude: ["node_modules"],
        },
        null,
        2,
      ),
      type: "json",
    })
  }
>>>>>>> d07d2a6 (Init API)
=======
>>>>>>> 19ce577 (convo fix and LLm tune)
}
