import { type Collection, ObjectId } from "mongodb"
import { database } from "../config/database"
import type { Chat, Message, ContentVersion, AssistantResponseVersion } from "../types"

export class ChatModel {
  private collection: Collection<Chat>

  constructor() {
    this.collection = database.getDb().collection<Chat>("chats")
  }

  async create(userId: string, title: string): Promise<Chat> {
    const initialMessage: Message = {
      _id: new ObjectId(),
      role: "user",
      content: [{ version: 1, text: title, createdAt: new Date() }],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const chat: Chat = {
      userId: new ObjectId(userId),
      title,
      messages: [initialMessage],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await this.collection.insertOne(chat)
    return { ...chat, _id: result.insertedId }
  }

  async findById(id: string): Promise<Chat | null> {
    if (!ObjectId.isValid(id)) return null
    return await this.collection.findOne({ _id: new ObjectId(id) })
  }

  async findByUserId(userId: string): Promise<Pick<Chat, "_id" | "title" | "updatedAt">[]> {
    if (!ObjectId.isValid(userId)) return []
    return await this.collection
      .find({ userId: new ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .project<{ _id: ObjectId; title: string; updatedAt: Date }>({ title: 1, updatedAt: 1 })
      .toArray()
  }

  async addMessage(chatId: string, message: Omit<Message, "_id" | "createdAt" | "updatedAt">): Promise<Chat | null> {
    const newMessage: Message = {
      _id: new ObjectId(),
      ...message,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(chatId) },
      {
        $push: { messages: newMessage },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" },
    )
    return result
  }

  async editUserMessage(chatId: string, messageId: string, newText: string): Promise<Chat | null> {
    const messageToUpdate = await this.collection.findOne(
      { _id: new ObjectId(chatId), "messages._id": new ObjectId(messageId) },
      { projection: { "messages.$": 1 } },
    )

    if (!messageToUpdate || !messageToUpdate.messages || messageToUpdate.messages.length === 0) {
      return null
    }

    const currentVersion = messageToUpdate.messages[0].content.length
    const newContentVersion: ContentVersion = {
      version: currentVersion + 1,
      text: newText,
      createdAt: new Date(),
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(chatId), "messages._id": new ObjectId(messageId) },
      {
        $push: { "messages.$.content": newContentVersion },
        $set: { "messages.$.updatedAt": new Date(), updatedAt: new Date() },
      },
      { returnDocument: "after" },
    )
    return result
  }

  async addAssistantResponse(
    chatId: string,
    response: Omit<AssistantResponseVersion, "version" | "createdAt">,
  ): Promise<Chat | null> {
    const newResponseVersion: AssistantResponseVersion = {
      ...response,
      version: 1, // This is the first response for a new prompt
      createdAt: new Date(),
    }

    const assistantMessage: Message = {
      _id: new ObjectId(),
      role: "assistant",
      content: [], // Assistant messages don't have user-editable content
      assistantResponse: [newResponseVersion],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(chatId) },
      {
        $push: { messages: assistantMessage },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" },
    )
    return result
  }
}
