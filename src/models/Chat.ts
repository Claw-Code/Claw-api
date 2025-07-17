import { type Collection, ObjectId } from "mongodb"
import { database } from "../config/database"
import type { Chat, Message } from "../types"

export class ChatModel {
  private collection: Collection<Chat>

  constructor() {
    this.collection = database.getDb().collection<Chat>("chats")
  }

  async create(chatData: Omit<Chat, "_id" | "createdAt" | "updatedAt">): Promise<Chat> {
    const chat: Chat = {
      ...chatData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await this.collection.insertOne(chat)
    return { ...chat, _id: result.insertedId.toString() }
  }

  async findById(id: string): Promise<Chat | null> {
    return await this.collection.findOne({ _id: new ObjectId(id) })
  }

  async findByUserId(userId: string): Promise<Chat[]> {
    return await this.collection.find({ userId }).sort({ updatedAt: -1 }).toArray()
  }

  async addMessage(chatId: string, message: Message): Promise<Chat | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(chatId) },
      {
        $push: { messages: message },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" },
    )
    return result
  }

  async updateMessage(chatId: string, messageId: string, updates: Partial<Message>): Promise<Chat | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(chatId), "messages.id": messageId },
      {
        $set: {
          "messages.$": { ...updates },
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )
    return result
  }
}
