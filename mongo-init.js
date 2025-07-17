// MongoDB initialization script
<<<<<<< HEAD
const db = db.getSiblingDB(process.env.DB_NAME || "claw_api")
=======
const db = db.getSiblingDB("v0_clone")
>>>>>>> d07d2a6 (Init API)

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

// Insert sample data
db.users.insertOne({
  username: "demo_user",
  email: "demo@example.com",
  createdAt: new Date(),
  updatedAt: new Date(),
})

<<<<<<< HEAD
print("Claw API database initialized successfully!")
=======
print("Database initialized successfully!")
>>>>>>> d07d2a6 (Init API)
