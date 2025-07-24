import { MongoClient, type Db } from "mongodb"

class Database {
  private client: MongoClient
  private db: Db
  private isConnected = false

  constructor() {
    const mongoUrl = process.env.MONGODB_URL || "mongodb://localhost:27017"
    this.client = new MongoClient(mongoUrl)
  }

  async connect(): Promise<void> {
    try {
      console.log("🔄 Connecting to MongoDB...")
      await this.client.connect()
      this.db = this.client.db(process.env.DB_NAME || "claw_api")
      await this.db.admin().ping()
      this.isConnected = true
      console.log("✅ Connected to MongoDB successfully")
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error)
      throw error
    }
  }

  getDb(): Db {
    if (!this.isConnected || !this.db) {
      throw new Error("Database not connected. Call connect() first.")
    }
    return this.db
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.isConnected = false
      console.log("🔌 Disconnected from MongoDB")
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected || !this.db) return false
      await this.db.admin().ping()
      return true
    } catch {
      this.isConnected = false
      return false
    }
  }
}

export const database = new Database()
