import type { FastifyInstance } from "fastify"
import { UserModel } from "../models/User"
import type { User, AuthPayload } from "../types"

export async function authRoutes(fastify: FastifyInstance) {
  const userModel = new UserModel()

  // Register user
  fastify.post<{ Body: Pick<User, "username" | "email" | "password"> }>(
    "/register",
    {
      schema: {
        tags: ["Authentication"],
        description: "Register a new user",
        body: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            username: { type: "string", minLength: 3 },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
          },
        },
      },
    },
    async (request, reply) => {
      const { username, email, password } = request.body
      const existingUser = await userModel.findByEmail(email)
      if (existingUser) {
        return reply.code(409).send({ error: "Conflict", message: "User with this email already exists." })
      }
      const user = await userModel.create({ username, email, password })
      reply.code(201).send({
        _id: user._id,
        username: user.username,
        email: user.email,
      })
    },
  )

  // Login user
  fastify.post<{ Body: Pick<User, "email" | "password"> }>(
    "/login",
    {
      schema: {
        tags: ["Authentication"],
        description: "Login a user and get a JWT token",
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body
      const user = await userModel.findByEmail(email)
      if (!user || !user.password) {
        return reply.code(401).send({ error: "Unauthorized", message: "Invalid credentials." })
      }
      const isMatch = await userModel.verifyPassword(password, user.password)
      if (!isMatch) {
        return reply.code(401).send({ error: "Unauthorized", message: "Invalid credentials." })
      }
      const payload: AuthPayload = { userId: user._id!.toString(), username: user.username }
      const token = fastify.jwt.sign(payload)
      reply.send({ token })
    },
  )

  // Get user profile (protected route)
  fastify.get(
    "/profile",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Authentication"],
        description: "Get current user's profile",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const { userId } = request.user as AuthPayload
      const user = await userModel.findById(userId)
      if (!user) {
        return reply.code(404).send({ error: "Not Found", message: "User not found." })
      }
      reply.send({
        _id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      })
    },
  )
}
