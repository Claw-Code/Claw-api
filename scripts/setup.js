#!/usr/bin/env node

const fs = require("fs")

console.log("🦅 Claw API Setup")
console.log("==================")

// Check if .env exists
if (!fs.existsSync(".env")) {
  console.log("📝 Creating .env file...")
  const envContent = `# Database
MONGODB_URL=mongodb://localhost:27017/claw_api
DB_NAME=claw_api

# External Game Generation API
EXTERNAL_GAME_API_URL=http://localhost:3000

# JWT Secret (change this in production!)
JWT_SECRET=claw-api-super-secret-jwt-key-change-in-production

# Server
NODE_ENV=development
PORT=8000
HOST=0.0.0.0
`
  fs.writeFileSync(".env", envContent)
  console.log("✅ .env file created")
} else {
  console.log("✅ .env file already exists")
}

// Create logs directory
if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs")
  console.log("✅ Logs directory created")
} else {
  console.log("✅ Logs directory already exists")
}

console.log("\n🚀 Setup complete!")
console.log("\n📋 Next steps:")
console.log("1. Edit .env file with your settings")
console.log("2. Start MongoDB:")
console.log("   docker run -d -p 27017:27017 --name mongodb mongo:7.0")
console.log("3. Run development server:")
console.log("   npm run dev")
console.log("\n🌐 API will be available at: http://localhost:8000")
console.log("📚 Documentation: http://localhost:8000/docs")
console.log("\n💡 If you have dependency issues, run: npm run clean")
