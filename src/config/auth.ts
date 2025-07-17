import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import jwt from "@fastify/jwt"

export async function setupAuth(fastify: FastifyInstance) {
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || "a-very-secret-key-that-should-be-in-env",
    sign: {
      expiresIn: "7d",
    },
  })

  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.code(401).send({ error: "Unauthorized", message: "Authentication token is missing or invalid." })
    }
  })
}

// Add authenticate to FastifyInstance interface
declare module "fastify" {
  export interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
