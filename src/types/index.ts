import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  username: string
  email: string
  password?: string
  createdAt: Date
  updatedAt: Date
}

export interface AuthPayload {
  userId: string
  username: string
}

export interface Conversation {
  _id?: ObjectId
  userId: ObjectId
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  _id: ObjectId
  conversationId: ObjectId
  role: "user" | "assistant"
  content: MessageContent[]
  gameResponse?: GameResponse
  createdAt: Date
  updatedAt: Date
}

export interface MessageContent {
  version: number
  text: string
  editedAt: Date
}

export interface GameResponse {
  version: number
  prompt: string
  files: GameFile[]
  status: "generating" | "completed" | "error"
  error?: string
  metadata?: {
    gameType: string
    framework: string
    features: string[]
  }
  createdAt: Date
}

export interface GameFile {
  path: string
  content: string
  type: "html" | "js" | "css" | "json" | "md"
  language: string
}

export interface ExternalAPIResponse {
  step: number
  totalSteps: number
  stepName: string
  progress: number
  message: string
}

export interface FileGeneratedEvent {
  filename: string
  content: string
  type: string
}

export interface CompleteEvent {
  files: GameFile[]
  metadata: {
    gameType: string
    framework: string
    totalFiles: number
  }
}

export interface FinalStreamResponse {
  chatId: string
  projectId: string
  totalFiles: number
  aiGeneratedFiles: number
  missingFilesGenerated: number
  chainUsed: string
  chainSteps: string[]
  setupInstructions: {
    npmInstall: string
    startCommand: string
    serveCommand: string
    url: string
    liveUrl: string
    port: number
    projectPath: string
  }
  validation: {
    isComplete: boolean
    totalFiles: number
    originalFiles: number
    missingFiles: string[]
  }
  timestamp: string
}

export interface PreviewEnvironment {
  id: string
  url: string
  status: "building" | "ready" | "error"
  buildLogs: string[]
  port?: number
}
