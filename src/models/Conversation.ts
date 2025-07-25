import { type Collection, ObjectId } from "mongodb"
import { database } from "../config/database"
import type { Conversation, Message, GameResponse } from "../types"

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

  async findByIdWithSummary(id: string): Promise<(Conversation & { summary: any }) | null> {
    if (!ObjectId.isValid(id)) return null

    const conversation = await this.collection.findOne({ _id: new ObjectId(id) })
    if (!conversation) return null

    // Calculate summary statistics
    const userMessages = conversation.messages.filter((m) => m.role === "user").length
    const assistantMessages = conversation.messages.filter((m) => m.role === "assistant").length
    const totalFiles = conversation.messages.reduce((count, msg) => {
      return count + (msg.gameResponse?.files?.length || 0)
    }, 0)

    const lastMessage = conversation.messages[conversation.messages.length - 1]
    const gameStatus = lastMessage?.gameResponse?.status || "none"

    const summary = {
      totalMessages: conversation.messages.length,
      userMessages,
      assistantMessages,
      totalFiles,
      lastActivity: conversation.updatedAt,
      gameStatus,
    }

    return { ...conversation, summary }
  }

  async findByUserId(userId: string): Promise<Pick<Conversation, "_id" | "title" | "updatedAt">[]> {
    if (!ObjectId.isValid(userId)) return []
    return await this.collection
      .find({ userId: new ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .project<{ _id: ObjectId; title: string; updatedAt: Date }>({ title: 1, updatedAt: 1 })
      .toArray()
  }

  async findByUserIdWithPreview(userId: string): Promise<any[]> {
    if (!ObjectId.isValid(userId)) return []

    console.log(`🔍 Finding conversations with preview for user: ${userId}`)

    const conversations = await this.collection
      .find({ userId: new ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .toArray()

    console.log(`📊 Found ${conversations.length} conversations`)

    return conversations.map((conv) => {
      console.log(`🔍 Processing conversation: ${conv._id} - "${conv.title}"`)
      console.log(`📝 Messages count: ${conv.messages.length}`)

      // Find the last message with a game response
      const lastGameMessage = [...conv.messages].reverse().find((msg) => {
        const hasGameResponse = msg.gameResponse && msg.gameResponse.files && msg.gameResponse.files.length > 0
        console.log(`📨 Message ${msg._id}: role=${msg.role}, hasGameResponse=${hasGameResponse}`)
        return hasGameResponse
      })

      let previewData = null
      if (lastGameMessage?.gameResponse) {
        const gameResponse = lastGameMessage.gameResponse
        console.log(`🎮 Found game response: status=${gameResponse.status}, files=${gameResponse.files?.length || 0}`)

        // Log first few files for debugging
        if (gameResponse.files && gameResponse.files.length > 0) {
          console.log(`📄 Files preview:`)
          gameResponse.files.slice(0, 3).forEach((file, index) => {
            console.log(`  ${index + 1}. ${file.path} (${file.type}) - ${file.content.length} chars`)
          })
        }

        // Generate preview URL (find index.html or first HTML file)
        let previewUrl = null
        const htmlFile = gameResponse.files?.find((file) => file.path === "index.html" || file.type === "html")
        if (htmlFile) {
          // In a real implementation, you'd serve these files statically
          // For now, we'll create a preview endpoint
          previewUrl = `/api/conversations/${conv._id}/preview`
          console.log(`🌐 Generated preview URL: ${previewUrl}`)
        }

        previewData = {
          status: gameResponse.status,
          filesCount: gameResponse.files?.length || 0,
          gameType: gameResponse.metadata?.gameType || "HTML5 Canvas Game",
          framework: gameResponse.metadata?.framework || "Vanilla JavaScript",
          previewUrl: previewUrl,
          previewFiles:
            gameResponse.files?.map((file) => ({
              path: file.path,
              type: file.type,
              language: file.language,
              size: file.content.length,
            })) || [],
        }

        console.log(`✅ Preview data created: ${JSON.stringify(previewData, null, 2)}`)
      } else {
        console.log(`❌ No game response found for conversation ${conv._id}`)
      }

      return {
        _id: conv._id,
        title: conv.title,
        updatedAt: conv.updatedAt,
        lastGameResponse: previewData,
      }
    })
  }

  async addMessage(
    conversationId: string,
    message: Omit<Message, "_id" | "createdAt" | "updatedAt">,
  ): Promise<Conversation | null> {
    if (!ObjectId.isValid(conversationId)) return null

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

    return result || null
  }

  async addGameResponse(
    conversationId: string,
    messageId: string,
    gameResponse: Omit<GameResponse, "version" | "createdAt">,
  ): Promise<Conversation | null> {
    console.log(`💾 Adding game response to conversation ${conversationId}, message ${messageId}`)
    console.log(`📊 Game response files: ${gameResponse.files.length}`)

    // Log the files being saved
    gameResponse.files.forEach((file, index) => {
      console.log(`📄 File ${index + 1}: ${file.path} (${file.type}) - ${file.content.length} chars`)
    })

    const conversation = await this.collection.findOne(
      { _id: new ObjectId(conversationId), "messages._id": new ObjectId(messageId) },
      { projection: { "messages.$": 1 } },
    )

    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
      console.log(`❌ Message not found: ${messageId} in conversation ${conversationId}`)
      return null
    }

    const currentMessage = conversation.messages[0]
    const nextVersion = (currentMessage.gameResponse?.version || 0) + 1

    const newGameResponse: GameResponse = {
      ...gameResponse,
      version: nextVersion,
      createdAt: new Date(),
    }

    console.log(`💾 Saving game response version ${nextVersion} with ${newGameResponse.files.length} files`)

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(conversationId), "messages._id": new ObjectId(messageId) },
      {
        $set: {
          "messages.$.gameResponse": newGameResponse,
          "messages.$.updatedAt": new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (result) {
      console.log(`✅ Game response saved successfully`)
    } else {
      console.log(`❌ Failed to save game response`)
    }

    return result || null
  }

  async deleteById(conversationId: string): Promise<boolean> {
    if (!ObjectId.isValid(conversationId)) return false
    const result = await this.collection.deleteOne({ _id: new ObjectId(conversationId) })
    return result.deletedCount === 1
  }

  // New method to get the latest game files for preview
  async getLatestGameFiles(conversationId: string): Promise<any[]> {
    if (!ObjectId.isValid(conversationId)) return []

    const conversation = await this.collection.findOne({ _id: new ObjectId(conversationId) })
    if (!conversation) return []

    // Find the last message with game files
    const lastGameMessage = [...conversation.messages]
      .reverse()
      .find((msg) => msg.gameResponse && msg.gameResponse.files && msg.gameResponse.files.length > 0)

    return lastGameMessage?.gameResponse?.files || []
  }
}
