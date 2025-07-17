import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  username: string
  email: string
  password?: string // Will be hashed
  createdAt: Date
  updatedAt: Date
}

export interface AuthPayload {
  userId: string
  username: string
}

export interface Chat {
  _id?: ObjectId
  userId: ObjectId
  title: string // The first user prompt becomes the title
  messages: Message[]
  contextDocuments?: Attachment[]
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  _id: ObjectId
  role: "user" | "assistant"
  content: ContentVersion[] // Array to store edit history
  attachments?: Attachment[]
  assistantResponse?: AssistantResponseVersion[] // For assistant messages, storing response versions
  createdAt: Date
  updatedAt: Date
}

export interface ContentVersion {
  version: number
  text: string
}

export interface Attachment {
  fileId: ObjectId
  filename: string
  mimetype: string
  size: number
  uploadedAt: Date
}

export interface CodeFile {
  path: string
  content: string
  type: "tsx" | "ts" | "css" | "json" | "html" | "md"
}

export interface CodeSnippet {
  files: CodeFile[]
  framework: string
  previewUrl?: string
  downloadUrl?: string
  status: "generating" | "ready" | "error"
}

export interface AssistantResponseVersion {
  version: number
  text: string // Supports Markdown
  code: CodeSnippet
  thinking?: string // LLM's thought process
  createdAt: Date
}

export interface LLMProvider {
  name: string
  generate: (prompt: string, context?: any) => Promise<string>
  isAvailable: () => Promise<boolean>
}

export interface PreviewEnvironment {
  id: string
  url: string
  status: "building" | "ready" | "error"
  buildLogs: string[]
}
