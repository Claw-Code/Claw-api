export interface User {
  _id?: string
  username: string
  email: string
  createdAt: Date
  updatedAt: Date
}

export interface Chat {
  _id?: string
  userId: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  code?: GeneratedCode
  timestamp: Date
}

export interface GeneratedCode {
  id: string
  files: CodeFile[]
  framework: string
  previewUrl?: string
  downloadUrl?: string
  status: "generating" | "ready" | "error"
}

export interface CodeFile {
  path: string
  content: string
  type: "tsx" | "ts" | "css" | "json" | "html"
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
