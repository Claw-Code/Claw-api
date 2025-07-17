import { type Collection, ObjectId } from "mongodb"
import { database } from "../config/database"
import type { User } from "../types"
<<<<<<< HEAD
<<<<<<< HEAD
import bcrypt from "bcrypt"
=======
>>>>>>> d07d2a6 (Init API)
=======
import bcrypt from "bcrypt"
>>>>>>> 19ce577 (convo fix and LLm tune)

export class UserModel {
  private collection: Collection<User>

  constructor() {
    this.collection = database.getDb().collection<User>("users")
  }

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 19ce577 (convo fix and LLm tune)
  async create(
    userData: Omit<User, "_id" | "createdAt" | "updatedAt" | "password"> & { password?: string },
  ): Promise<User> {
    const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : undefined

<<<<<<< HEAD
    const user: User = {
      ...userData,
      password: hashedPassword,
=======
  async create(userData: Omit<User, "_id" | "createdAt" | "updatedAt">): Promise<User> {
    const user: User = {
      ...userData,
>>>>>>> d07d2a6 (Init API)
=======
    const user: User = {
      ...userData,
      password: hashedPassword,
>>>>>>> 19ce577 (convo fix and LLm tune)
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await this.collection.insertOne(user)
<<<<<<< HEAD
<<<<<<< HEAD
    return { ...user, _id: result.insertedId }
  }

  async findById(id: string): Promise<User | null> {
    if (!ObjectId.isValid(id)) return null
=======
    return { ...user, _id: result.insertedId.toString() }
  }

  async findById(id: string): Promise<User | null> {
>>>>>>> d07d2a6 (Init API)
=======
    return { ...user, _id: result.insertedId }
  }

  async findById(id: string): Promise<User | null> {
    if (!ObjectId.isValid(id)) return null
>>>>>>> 19ce577 (convo fix and LLm tune)
    return await this.collection.findOne({ _id: new ObjectId(id) })
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.collection.findOne({ email })
  }

<<<<<<< HEAD
<<<<<<< HEAD
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
=======
  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: "after" },
    )
    return result
>>>>>>> d07d2a6 (Init API)
=======
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
>>>>>>> 19ce577 (convo fix and LLm tune)
  }
}
