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
    console.log(`🔍 DEBUG: ConversationModel.addMessage called with conversationId: ${conversationId}`)

    if (!ObjectId.isValid(conversationId)) {
      console.log(`🔍 DEBUG: Invalid conversationId: ${conversationId}`)
      return null
    }

    const newMessage: Message = {
      _id: new ObjectId(),
      ...message,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log(`🔍 DEBUG: Created new message with ID: ${newMessage._id}`)
    console.log(`🔍 DEBUG: Message role: ${newMessage.role}`)
    console.log(`🔍 DEBUG: Message content length: ${newMessage.content?.length || 0}`)

    try {
      console.log(`🔍 DEBUG: Attempting findOneAndUpdate...`)
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(conversationId) },
        {
          $push: { messages: newMessage },
          $set: { updatedAt: new Date() },
        },
        { returnDocument: "after" },
      )

      console.log(`🔍 DEBUG: MongoDB findOneAndUpdate raw result:`, typeof result)
      console.log(`🔍 DEBUG: Raw result keys:`, result ? Object.keys(result) : "null")

      // The issue: findOneAndUpdate returns the document directly, not wrapped in a result object
      // But sometimes MongoDB drivers return different formats, so let's handle both cases
      let conversation: Conversation | null = null

      if (result) {
        // Check if it's the document directly or wrapped in a result object
        if (result._id && result.messages) {
          // It's the document directly
          conversation = result as Conversation
          console.log(`🔍 DEBUG: Got document directly`)
        } else if (result.value) {
          // It's wrapped in a result object
          conversation = result.value as Conversation
          console.log(`🔍 DEBUG: Got document from result.value`)
        } else {
          console.log(`🔍 DEBUG: Unexpected result format`)
          // Fallback: manually fetch the updated document
          conversation = await this.collection.findOne({ _id: new ObjectId(conversationId) })
          console.log(`🔍 DEBUG: Fallback fetch successful: ${!!conversation}`)
        }
      }

      if (conversation) {
        console.log(`🔍 DEBUG: Final conversation _id: ${conversation._id}`)
        console.log(`🔍 DEBUG: Final conversation title: ${conversation.title}`)
        console.log(`🔍 DEBUG: Final conversation messages exists: ${!!conversation.messages}`)
        console.log(`🔍 DEBUG: Final conversation messages is array: ${Array.isArray(conversation.messages)}`)
        console.log(`🔍 DEBUG: Final conversation messages length: ${conversation.messages?.length || 0}`)

        if (conversation.messages && conversation.messages.length > 0) {
          const lastMessage = conversation.messages[conversation.messages.length - 1]
          console.log(`🔍 DEBUG: Last message ID: ${lastMessage._id}`)
          console.log(`🔍 DEBUG: Last message role: ${lastMessage.role}`)
        }
      } else {
        console.log(`🔍 DEBUG: No conversation returned from update`)
      }

      return conversation
    } catch (error) {
      console.error(`❌ DEBUG: Error in addMessage:`, error)
      throw error
    }
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

    // Apply the same fix here
    if (result && result._id && result.messages) {
      return result as Conversation
    } else if (result && result.value) {
      return result.value as Conversation
    } else {
      // Fallback
      return await this.collection.findOne({ _id: new ObjectId(conversationId) })
    }
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

    // Apply the same fix here
    if (result && result._id && result.messages) {
      return result as Conversation
    } else if (result && result.value) {
      return result.value as Conversation
    } else {
      // Fallback
      return await this.collection.findOne({ _id: new ObjectId(conversationId) })
    }
  }

  async deleteMessage(conversationId: string, messageId: string): Promise<boolean> {
    if (!ObjectId.isValid(conversationId) || !ObjectId.isValid(messageId)) {
      return false
    }

    const result = await this.collection.updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $pull: { messages: { _id: new ObjectId(messageId) } },
        $set: { updatedAt: new Date() },
      },
    )

    return result.modifiedCount > 0
  }

  async deleteById(conversationId: string): Promise<boolean> {
    if (!ObjectId.isValid(conversationId)) {
      return false
    }

    const result = await this.collection.deleteOne({ _id: new ObjectId(conversationId) })
    return result.deletedCount === 1
  }
}
