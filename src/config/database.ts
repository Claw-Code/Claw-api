import { MongoClient, type Db } from "mongodb"

class Database {
  private client: MongoClient
  private db: Db
<<<<<<< HEAD
  private isConnected = false
  private maxRetries = 5
  private retryDelay = 2000

  constructor() {
    const mongoUrl = process.env.MONGODB_URL || "mongodb://localhost:27017"
    this.client = new MongoClient(mongoUrl, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
    })
  }

  async connect(): Promise<void> {
    let retries = 0

    while (retries < this.maxRetries && !this.isConnected) {
      try {
        console.log(`🔄 Attempting to connect to MongoDB (attempt ${retries + 1}/${this.maxRetries})...`)

        await this.client.connect()
        this.db = this.client.db(process.env.DB_NAME || "claw_api")

        // Test the connection
        await this.db.admin().ping()

        this.isConnected = true
        console.log("✅ Connected to MongoDB successfully")

        // Setup connection event listeners
        this.client.on("error", (error) => {
          console.error("❌ MongoDB connection error:", error)
          this.isConnected = false
        })

        this.client.on("close", () => {
          console.log("⚠️ MongoDB connection closed")
          this.isConnected = false
        })

        return
      } catch (error) {
        retries++
        console.error(`❌ MongoDB connection attempt ${retries} failed:`, error)

        if (retries >= this.maxRetries) {
          throw new Error(`Failed to connect to MongoDB after ${this.maxRetries} attempts: ${error}`)
        }

        console.log(`⏳ Retrying in ${this.retryDelay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay))
        this.retryDelay *= 1.5 // Exponential backoff
      }
=======

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
>>>>>>> d07d2a6 (Init API)
    }
  }

  getDb(): Db {
<<<<<<< HEAD
    if (!this.isConnected || !this.db) {
      throw new Error("Database not connected. Call connect() first.")
    }
=======
>>>>>>> d07d2a6 (Init API)
    return this.db
  }

  async disconnect(): Promise<void> {
<<<<<<< HEAD
    if (this.client) {
      await this.client.close()
      this.isConnected = false
      console.log("🔌 Disconnected from MongoDB")
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected || !this.db) {
        return false
      }

      await this.db.admin().ping()
      return true
    } catch {
      this.isConnected = false
      return false
    }
=======
    await this.client.close()
>>>>>>> d07d2a6 (Init API)
  }
}

export const database = new Database()
