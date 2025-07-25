import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import jwt from "@fastify/jwt"

export async function setupAuth(fastify: FastifyInstance) {
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || "a-very-secret-key-that-should-be-in-env",
    sign: {
      expiresIn: "7d",
    },
  })

  // Standard authentication for regular API endpoints
  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.code(401).send({
        success: false,
        error: "Unauthorized",
        message: "Authentication token is missing or invalid.",
      })
    }
  })

  // Special authentication for SSE endpoints that accepts token from query params
  fastify.decorate("authenticateSSE", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // First try the standard Authorization header
      if (request.headers.authorization) {
        await request.jwtVerify()
        return
      }

      // If no Authorization header, try query parameter (for SSE)
      const token = (request.query as any)?.token
      if (token) {
        console.log(`🔐 SSE: Attempting authentication with query token`)

        // Manually verify the token
        const decoded = fastify.jwt.verify(token)
        request.user = decoded
        console.log(`✅ SSE: Authentication successful for user ${(decoded as any).userId}`)
        return
      }

      // No token found anywhere
      throw new Error("No token provided")
    } catch (err) {
      console.error(`❌ SSE: Authentication failed:`, err)
      reply.code(401).send({
        success: false,
        error: "Unauthorized",
        message: "Authentication token is missing or invalid.",
      })
    }
  })

  console.log("✅ Authentication methods registered successfully")
}

declare module "fastify" {
  export interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    authenticateSSE: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
