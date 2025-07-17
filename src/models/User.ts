import { type Collection, ObjectId } from "mongodb"
import { database } from "../config/database"
import type { User } from "../types"
import bcrypt from "bcrypt"

export class UserModel {
  private collection: Collection<User>

  constructor() {
    this.collection = database.getDb().collection<User>("users")
  }

  async create(
    userData: Omit<User, "_id" | "createdAt" | "updatedAt" | "password"> & { password?: string },
  ): Promise<User> {
    const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : undefined

    const user: User = {
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await this.collection.insertOne(user)
    return { ...user, _id: result.insertedId }
  }

  async findById(id: string): Promise<User | null> {
    if (!ObjectId.isValid(id)) return null
    return await this.collection.findOne({ _id: new ObjectId(id) })
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.collection.findOne({ email })
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }
}
