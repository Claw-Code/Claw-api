import { MongoClient, type Db } from "mongodb"

class Database {
  private client: MongoClient
  private db: Db

  constructor() {
    const mongoUrl = process.env.MONGODB_URL || "mongodb://localhost:27017"
    this.client = new MongoClient(mongoUrl)
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect()
      this.db = this.client.db(process.env.DB_NAME || "claw_api")
      console.log("Connected to MongoDB")
    } catch (error) {
      console.error("MongoDB connection error:", error)
      throw error
    }
  }

  getDb(): Db {
    return this.db
  }

  async disconnect(): Promise<void> {
    await this.client.close()
  }
}

export const database = new Database()
