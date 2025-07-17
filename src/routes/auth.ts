import type { FastifyInstance } from "fastify"
import { UserModel } from "../models/User"
<<<<<<< HEAD
import type { User, AuthPayload } from "../types"
=======
>>>>>>> d07d2a6 (Init API)

export async function authRoutes(fastify: FastifyInstance) {
  const userModel = new UserModel()

  // Register user
<<<<<<< HEAD
  fastify.post<{ Body: Pick<User, "username" | "email" | "password"> }>(
=======
  fastify.post(
>>>>>>> d07d2a6 (Init API)
    "/register",
    {
      schema: {
        tags: ["Authentication"],
        description: "Register a new user",
        body: {
          type: "object",
<<<<<<< HEAD
          required: ["username", "email", "password"],
          properties: {
            username: { type: "string", minLength: 3 },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
=======
          required: ["username", "email"],
          properties: {
            username: { type: "string" },
            email: { type: "string", format: "email" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              user: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  username: { type: "string" },
                  email: { type: "string" },
                },
              },
            },
>>>>>>> d07d2a6 (Init API)
          },
        },
      },
    },
    async (request, reply) => {
<<<<<<< HEAD
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
=======
      try {
        const { username, email } = request.body as { username: string; email: string }

        // Check if user already exists
        const existingUser = await userModel.findByEmail(email)
        if (existingUser) {
          return reply.code(400).send({
            success: false,
            error: "User already exists",
          })
        }

        const user = await userModel.create({ username, email })

        reply.code(201).send({
          success: true,
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
          },
        })
      } catch (error) {
        reply.code(500).send({
          success: false,
          error: "Failed to create user",
        })
      }
    },
  )

  // Get user profile
  fastify.get(
    "/profile/:userId",
    {
      schema: {
        tags: ["Authentication"],
        description: "Get user profile",
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
        const user = await userModel.findById(userId)

        if (!user) {
          return reply.code(404).send({
            success: false,
            error: "User not found",
          })
        }

        reply.send({
          success: true,
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
          },
        })
      } catch (error) {
        reply.code(500).send({
          success: false,
          error: "Failed to get user profile",
        })
      }
>>>>>>> d07d2a6 (Init API)
    },
  )
}
