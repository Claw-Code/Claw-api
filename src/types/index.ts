<<<<<<< HEAD
<<<<<<< HEAD
import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  username: string
  email: string
  password?: string // Will be hashed
=======
=======
import type { ObjectId } from "mongodb"

>>>>>>> 19ce577 (convo fix and LLm tune)
export interface User {
  _id?: ObjectId
  username: string
  email: string
<<<<<<< HEAD
>>>>>>> d07d2a6 (Init API)
=======
  password?: string // Will be hashed
>>>>>>> 19ce577 (convo fix and LLm tune)
  createdAt: Date
  updatedAt: Date
}

<<<<<<< HEAD
<<<<<<< HEAD
export interface AuthPayload {
  userId: string
  username: string
}

// Renamed from Chat to Conversation for clarity
export interface Conversation {
  _id?: ObjectId
  userId: ObjectId
  title: string // The first user prompt becomes the title
=======
export interface Chat {
  _id?: string
  userId: string
  title: string
>>>>>>> d07d2a6 (Init API)
=======
export interface AuthPayload {
  userId: string
  username: string
}

export interface Chat {
  _id?: ObjectId
  userId: ObjectId
  title: string // The first user prompt becomes the title
>>>>>>> 19ce577 (convo fix and LLm tune)
  messages: Message[]
  contextDocuments?: Attachment[]
  createdAt: Date
  updatedAt: Date
}

export interface Message {
<<<<<<< HEAD
<<<<<<< HEAD
  _id: ObjectId
  conversationId: ObjectId
  role: "user" | "assistant"
  content: MessageContent[]
  attachments?: Attachment[]
  llmResponse?: LLMResponse[]
  createdAt: Date
  updatedAt: Date
}

export interface MessageContent {
  version: number
  text: string
  editedAt: Date
}

export interface Attachment {
  _id: ObjectId
  messageId: ObjectId
  filename: string
  originalName: string
  mimetype: string
  size: number
  gridfsId: ObjectId
  uploadedAt: Date
}

export interface LLMResponse {
  version: number
  provider: string
  textResponse: string
  codeResponse?: CodeResponse
  thinking?: string
  status: "generating" | "completed" | "error"
  error?: string
  createdAt: Date
}

export interface CodeResponse {
  files: CodeFile[]
  framework: string
  language: string
  previewUrl?: string
  downloadUrl?: string
=======
  id: string
=======
  _id: ObjectId
>>>>>>> 19ce577 (convo fix and LLm tune)
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
>>>>>>> d07d2a6 (Init API)
}

<<<<<<< HEAD
export interface CodeFile {
  path: string
  content: string
<<<<<<< HEAD
  type: "tsx" | "ts" | "css" | "json" | "html" | "md" | "js" | "jsx"
  language: string
=======
  type: "tsx" | "ts" | "css" | "json" | "html"
>>>>>>> d07d2a6 (Init API)
=======
export interface AssistantResponseVersion {
  version: number
  text: string // Supports Markdown
  code: CodeSnippet
  thinking?: string // LLM's thought process
  createdAt: Date
>>>>>>> 19ce577 (convo fix and LLm tune)
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
<<<<<<< HEAD

export interface GeneratedCode {
  files: CodeFile[]
  framework: string
  language: string
  previewUrl?: string
  downloadUrl?: string
}
=======
>>>>>>> d07d2a6 (Init API)
