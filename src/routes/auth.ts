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
            username: {
              type: "string",
              minLength: 3,
              maxLength: 50,
              pattern: "^[a-zA-Z0-9_]+$",
              description: "Unique username (alphanumeric and underscore only)",
            },
            email: {
              type: "string",
              format: "email",
              maxLength: 100,
              description: "Valid email address",
            },
            password: {
              type: "string",
              minLength: 6,
              maxLength: 100,
              description: "Strong password (min 6 characters)",
            },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  username: { type: "string" },
                  email: { type: "string", format: "email" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { username, email, password } = request.body
      const existingUser = await userModel.findByEmail(email)
      if (existingUser) {
        return reply.code(409).send({
          success: false,
          error: "Conflict",
          message: "User with this email already exists.",
        })
      }
      const user = await userModel.create({ username, email, password })
      reply.code(201).send({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        message: "User registered successfully",
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
            email: {
              type: "string",
              format: "email",
              description: "Registered email address",
            },
            password: {
              type: "string",
              description: "User password",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  token: {
                    type: "string",
                    description: "JWT authentication token (expires in 7 days)",
                  },
                  user: {
                    type: "object",
                    properties: {
                      _id: { type: "string" },
                      username: { type: "string" },
                      email: { type: "string", format: "email" },
                    },
                  },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body
      const user = await userModel.findByEmail(email)
      if (!user || !user.password) {
        return reply.code(401).send({
          success: false,
          error: "Unauthorized",
          message: "Invalid credentials.",
        })
      }
      const isMatch = await userModel.verifyPassword(password, user.password)
      if (!isMatch) {
        return reply.code(401).send({
          success: false,
          error: "Unauthorized",
          message: "Invalid credentials.",
        })
      }
      const payload: AuthPayload = { userId: user._id!.toString(), username: user.username }
      const token = fastify.jwt.sign(payload)
      reply.send({
        success: true,
        data: {
          token,
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
          },
        },
        message: "Login successful",
      })
    },
  )

  // Get user profile
  fastify.get(
    "/profile",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["Authentication"],
        description: "Get current user's profile",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  username: { type: "string" },
                  email: { type: "string", format: "email" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.user as AuthPayload
      const user = await userModel.findById(userId)
      if (!user) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "User not found.",
        })
      }
      reply.send({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      })
    },
  )
}
