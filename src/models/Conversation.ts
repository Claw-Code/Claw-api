import { type Collection, ObjectId } from "mongodb"
import { database } from "../config/database"
import type { Conversation, Message, MessageContent, LLMResponse } from "../types"

export class ConversationModel {
  private collection: Collection<Conversation>

  constructor() {
    this.collection = database.getDb().collection<Conversation>("conversations")
  }

  async create(userId: string, title: string): Promise<Conversation> {
    const conversation: Conversation = {
      userId: new ObjectId(userId),
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await this.collection.insertOne(conversation)
    return { ...conversation, _id: result.insertedId }
  }

  async findById(id: string): Promise<Conversation | null> {
    if (!ObjectId.isValid(id)) return null
    return await this.collection.findOne({ _id: new ObjectId(id) })
  }

  async findByUserId(userId: string): Promise<Pick<Conversation, "_id" | "title" | "updatedAt">[]> {
    if (!ObjectId.isValid(userId)) return []
    return await this.collection
      .find({ userId: new ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .project<{ _id: ObjectId; title: string; updatedAt: Date }>({ title: 1, updatedAt: 1 })
      .toArray()
  }

  async addMessage(
    conversationId: string,
    message: Omit<Message, "_id" | "createdAt" | "updatedAt">,
  ): Promise<Conversation | null> {
    const newMessage: Message = {
      _id: new ObjectId(),
      ...message,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(conversationId) },
      {
        $push: { messages: newMessage },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" },
    )
    return result
  }

  async editMessageContent(conversationId: string, messageId: string, newText: string): Promise<Conversation | null> {
    // First, get the current message to determine the next version
    const conversation = await this.collection.findOne(
      { _id: new ObjectId(conversationId), "messages._id": new ObjectId(messageId) },
      { projection: { "messages.$": 1 } },
    )

    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
      return null
    }

    const currentMessage = conversation.messages[0]
    const nextVersion = currentMessage.content.length + 1

    const newContentVersion: MessageContent = {
      version: nextVersion,
      text: newText,
      editedAt: new Date(),
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(conversationId), "messages._id": new ObjectId(messageId) },
      {
        $push: { "messages.$.content": newContentVersion },
        $set: { "messages.$.updatedAt": new Date(), updatedAt: new Date() },
      },
      { returnDocument: "after" },
    )
    return result
  }

  async addLLMResponse(
    conversationId: string,
    messageId: string,
    response: Omit<LLMResponse, "version" | "createdAt">,
  ): Promise<Conversation | null> {
    // Get current message to determine next version
    const conversation = await this.collection.findOne(
      { _id: new ObjectId(conversationId), "messages._id": new ObjectId(messageId) },
      { projection: { "messages.$": 1 } },
    )

    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
      return null
    }

    const currentMessage = conversation.messages[0]
    const nextVersion = (currentMessage.llmResponse?.length || 0) + 1

    const newLLMResponse: LLMResponse = {
      ...response,
      version: nextVersion,
      createdAt: new Date(),
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(conversationId), "messages._id": new ObjectId(messageId) },
      {
        $push: { "messages.$.llmResponse": newLLMResponse },
        $set: { "messages.$.updatedAt": new Date(), updatedAt: new Date() },
      },
      { returnDocument: "after" },
    )
    return result
  }
}
