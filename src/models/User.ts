import { type Collection, ObjectId } from "mongodb"
import { database } from "../config/database"
import type { User } from "../types"

export class UserModel {
  private collection: Collection<User>

  constructor() {
    this.collection = database.getDb().collection<User>("users")
  }

  async create(userData: Omit<User, "_id" | "createdAt" | "updatedAt">): Promise<User> {
    const user: User = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await this.collection.insertOne(user)
    return { ...user, _id: result.insertedId.toString() }
  }

  async findById(id: string): Promise<User | null> {
    return await this.collection.findOne({ _id: new ObjectId(id) })
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.collection.findOne({ email })
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: "after" },
    )
    return result
  }
}
