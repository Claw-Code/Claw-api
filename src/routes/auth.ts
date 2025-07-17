import type { FastifyInstance } from "fastify"
import { UserModel } from "../models/User"

export async function authRoutes(fastify: FastifyInstance) {
  const userModel = new UserModel()

  // Register user
  fastify.post(
    "/register",
    {
      schema: {
        tags: ["Authentication"],
        description: "Register a new user",
        body: {
          type: "object",
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
          },
        },
      },
    },
    async (request, reply) => {
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
    },
  )
}
