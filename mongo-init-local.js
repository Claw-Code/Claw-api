// MongoDB initialization script for local development
const db = db.getSiblingDB("claw_api")

// Create collections
db.createCollection("users")
db.createCollection("chats")

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 })
db.users.createIndex({ createdAt: 1 })

db.chats.createIndex({ userId: 1 })
db.chats.createIndex({ createdAt: 1 })
db.chats.createIndex({ updatedAt: 1 })
db.chats.createIndex({ "messages.id": 1 })

// Insert sample data for local development
db.users.insertMany([
  {
    username: "demo_user",
    email: "demo@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    username: "test_gamer",
    email: "gamer@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
])

print("Claw API local database initialized successfully!")
