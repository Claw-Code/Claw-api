import type { FastifyInstance } from "fastify"
import { GridFSBucket, ObjectId } from "mongodb"
import { database } from "../config/database"
import multipart from "@fastify/multipart"

export async function uploadRoutes(fastify: FastifyInstance) {
  await fastify.register(multipart)

  // Upload a document
  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Upload"],
        description: "Upload a document to be used as context in chats.",
        consumes: ["multipart/form-data"],
      },
    },
    async (request, reply) => {
      const data = await request.file()
      if (!data) {
        return reply.code(400).send({ error: "Bad Request", message: "No file uploaded." })
      }

      const bucket = new GridFSBucket(database.getDb(), { bucketName: "uploads" })
      const uploadStream = bucket.openUploadStream(data.filename, {
        metadata: { mimetype: data.mimetype },
      })

      await data.file.pipe(uploadStream)

      uploadStream.on("finish", () => {
        reply.code(201).send({
          fileId: uploadStream.id,
          filename: data.filename,
          mimetype: data.mimetype,
        })
      })
    },
  )

  // Download a document
  fastify.get<{ Params: { fileId: string } }>(
    "/:fileId",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Upload"],
        description: "Download an uploaded document.",
      },
    },
    async (request, reply) => {
      const { fileId } = request.params
      if (!ObjectId.isValid(fileId)) {
        return reply.code(400).send({ error: "Bad Request", message: "Invalid file ID." })
      }

      const bucket = new GridFSBucket(database.getDb(), { bucketName: "uploads" })
      const downloadStream = bucket.openDownloadStream(new ObjectId(fileId))

      reply.type("application/octet-stream")
      reply.send(downloadStream)
    },
  )
}
