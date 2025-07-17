import type { FastifyInstance } from "fastify"
import { ChatModel } from "../models/Chat"
import { LLMService } from "../services/llm/LLMService"
import { CodeCompiler } from "../services/CodeCompiler"
import { v4 as uuidv4 } from "uuid"
import type { Message, GeneratedCode, CodeFile } from "../types"

export async function chatRoutes(fastify: FastifyInstance) {
  const chatModel = new ChatModel()
  const llmService = new LLMService()
  const codeCompiler = new CodeCompiler()

  // Create new chat
  fastify.post(
    "/create",
    {
      schema: {
        tags: ["Chat"],
        description: "Create a new chat session",
        body: {
          type: "object",
          required: ["userId", "title"],
          properties: {
            userId: { type: "string" },
            title: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
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
    },
  )

  // Get user chats
  fastify.get(
    "/user/:userId",
    {
      schema: {
        tags: ["Chat"],
        description: "Get all chats for a user",
        params: {
          type: "object",
          properties: {
            userId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { userId } = request.params as { userId: string }
        const chats = await chatModel.findByUserId(userId)

        reply.send({
          success: true,
          chats,
        })
      } catch (error) {
        reply.code(500).send({
          success: false,
          error: "Failed to get chats",
        })
      }
    },
  )

  // Send message and generate code
  fastify.post(
    "/:chatId/message",
    {
      schema: {
        tags: ["Chat"],
        description: "Send a message and generate code",
        params: {
          type: "object",
          properties: {
            chatId: { type: "string" },
          },
        },
        body: {
          type: "object",
          required: ["content"],
          properties: {
            content: { type: "string" },
            framework: { type: "string", default: "next.js" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { chatId } = request.params as { chatId: string }
        const { content, framework = "next.js" } = request.body as {
          content: string
          framework?: string
        }

        // Add user message
        const userMessage: Message = {
          id: uuidv4(),
          role: "user",
          content,
          timestamp: new Date(),
        }

        await chatModel.addMessage(chatId, userMessage)

        // Generate code using LLM
        const generatedCodeContent = await llmService.generateCode(content, { framework })

        // Parse generated code into files
        const files = parseCodeIntoFiles(generatedCodeContent, framework)

        const generatedCode: GeneratedCode = {
          id: uuidv4(),
          files,
          framework,
          status: "generating",
        }

        // Create assistant message
        const assistantMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: "I've generated the code for your request. Compiling and creating preview...",
          code: generatedCode,
          timestamp: new Date(),
        }

        await chatModel.addMessage(chatId, assistantMessage)

        // Compile and create preview (async)
        codeCompiler
          .compileAndPreview(generatedCode)
          .then(async (previewEnv) => {
            generatedCode.previewUrl = previewEnv.url
            generatedCode.status = previewEnv.status === "ready" ? "ready" : "error"

            // Generate download link
            if (previewEnv.status === "ready") {
              generatedCode.downloadUrl = await codeCompiler.generateDownloadLink(generatedCode)
            }

            // Update message with preview URL
            assistantMessage.code = generatedCode
            assistantMessage.content =
              previewEnv.status === "ready"
                ? "Code generated successfully! You can preview it and download the source code."
                : "Code generation completed but preview failed. You can still download the source code."

            await chatModel.updateMessage(chatId, assistantMessage.id, assistantMessage)
          })
          .catch(async (error) => {
            generatedCode.status = "error"
            assistantMessage.content = `Code generation failed: ${error.message}`
            assistantMessage.code = generatedCode

            await chatModel.updateMessage(chatId, assistantMessage.id, assistantMessage)
          })

        reply.send({
          success: true,
          message: assistantMessage,
        })
      } catch (error) {
        reply.code(500).send({
          success: false,
          error: `Failed to process message: ${error}`,
        })
      }
    },
  )

  // Get chat by ID
  fastify.get(
    "/:chatId",
    {
      schema: {
        tags: ["Chat"],
        description: "Get chat by ID",
        params: {
          type: "object",
          properties: {
            chatId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { chatId } = request.params as { chatId: string }
        const chat = await chatModel.findById(chatId)

        if (!chat) {
          return reply.code(404).send({
            success: false,
            error: "Chat not found",
          })
        }

        reply.send({
          success: true,
          chat,
        })
      } catch (error) {
        reply.code(500).send({
          success: false,
          error: "Failed to get chat",
        })
      }
    },
  )
}

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
}
