import type { FastifyInstance } from "fastify"
import { CodeCompiler } from "../services/CodeCompiler"

export async function previewRoutes(fastify: FastifyInstance) {
  const codeCompiler = new CodeCompiler()

  // Get preview status
  fastify.get(
    "/:previewId/status",
    {
      schema: {
        tags: ["Preview"],
        description: "Get preview environment status",
        params: {
          type: "object",
          properties: {
            previewId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { previewId } = request.params as { previewId: string }

        // In a real implementation, you'd track preview environments
        // For now, return a mock response
        reply.send({
          success: true,
          preview: {
            id: previewId,
            status: "ready",
            url: `http://localhost:3005`,
            buildLogs: ["Build completed successfully"],
          },
        })
      } catch (error) {
        reply.code(500).send({
          success: false,
          error: "Failed to get preview status",
        })
      }
    },
  )
}
