import type { FastifyInstance } from "fastify"
import { createReadStream } from "fs"
import { join } from "path"

export async function downloadRoutes(fastify: FastifyInstance) {
  // Download generated code
  fastify.get(
    "/:downloadId",
    {
      schema: {
        tags: ["Download"],
        description: "Download generated code as ZIP file",
        params: {
          type: "object",
          properties: {
            downloadId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { downloadId } = request.params as { downloadId: string }
        const workspaceDir = process.env.WORKSPACE_DIR || "./workspace"
        const zipPath = join(workspaceDir, "downloads", `${downloadId}.zip`)

        const stream = createReadStream(zipPath)

        reply.type("application/zip")
        reply.header("Content-Disposition", `attachment; filename="generated-code-${downloadId}.zip"`)

        return reply.send(stream)
      } catch (error) {
        reply.code(404).send({
          success: false,
          error: "Download not found",
        })
      }
    },
  )
}
