import { type Collection, ObjectId, GridFSBucket } from "mongodb"
import { database } from "../config/database"
import type { Attachment } from "../types"

export class AttachmentModel {
  private collection: Collection<Attachment>
  private bucket: GridFSBucket

  constructor() {
    this.collection = database.getDb().collection<Attachment>("attachments")
    this.bucket = new GridFSBucket(database.getDb(), { bucketName: "attachments" })
  }

  async create(
    messageId: string,
    filename: string,
    originalName: string,
    mimetype: string,
    size: number,
    gridfsId: ObjectId,
  ): Promise<Attachment> {
    const attachment: Attachment = {
      _id: new ObjectId(),
      messageId: new ObjectId(messageId),
      filename,
      originalName,
      mimetype,
      size,
      gridfsId,
      uploadedAt: new Date(),
    }

    const result = await this.collection.insertOne(attachment)
    return { ...attachment, _id: result.insertedId }
  }

  async findByMessageId(messageId: string): Promise<Attachment[]> {
    if (!ObjectId.isValid(messageId)) return []
    return await this.collection.find({ messageId: new ObjectId(messageId) }).toArray()
  }

  async findById(id: string): Promise<Attachment | null> {
    if (!ObjectId.isValid(id)) return null
    return await this.collection.findOne({ _id: new ObjectId(id) })
  }

  getDownloadStream(gridfsId: ObjectId) {
    return this.bucket.openDownloadStream(gridfsId)
  }

  getUploadStream(filename: string) {
    return this.bucket.openUploadStream(filename)
  }
}
