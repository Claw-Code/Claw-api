# 🦅 Claw API

**Simple API for user authentication and chat storage with external game generation.**

## 🚀 Quick Start

### Local Development (No Docker)

1. **Setup project**:
\`\`\`bash
git clone <repository>
cd claw-api
npm install
npm run setup
\`\`\`

2. **Start MongoDB**:
\`\`\`bash
docker run -d -p 27017:27017 --name mongodb mongo:7.0
\`\`\`

3. **Start development server**:
\`\`\`bash
npm run dev
\`\`\`

4. **Access the API**:
- API: http://localhost:8000
- Documentation: http://localhost:8000/docs
- Health: http://localhost:8000/health

### Using Docker

\`\`\`bash
docker-compose up -d
\`\`\`

## 📡 API Usage

### 1. Register User
\`\`\`bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "gamer", "email": "gamer@example.com", "password": "password123"}'
\`\`\`

### 2. Login
\`\`\`bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "gamer@example.com", "password": "password123"}'
\`\`\`

### 3. Create Conversation
\`\`\`bash
curl -X POST http://localhost:8000/api/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Snake Game"}'
\`\`\`

### 4. Generate Game
\`\`\`bash
curl -X POST http://localhost:8000/api/conversations/CONVERSATION_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "text=Create a Snake game"
\`\`\`

### 5. Stream Updates
\`\`\`javascript
const eventSource = new EventSource('http://localhost:8000/api/conversations/CONVERSATION_ID/messages/MESSAGE_ID/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type, data);
};
\`\`\`

## 🛠️ Development

\`\`\`bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run setup    # Initial project setup
\`\`\`

## 📁 Project Structure

\`\`\`
src/
├── config/          # Database and auth setup
├── models/          # MongoDB models
├── routes/          # API routes
├── services/        # External API integration
├── types/           # TypeScript types
└── app.ts           # Main application
\`\`\`

## 🔧 Configuration

Edit `.env` file:
\`\`\`bash
MONGODB_URL=mongodb://localhost:27017/claw_api
EXTERNAL_GAME_API_URL=http://localhost:3001
JWT_SECRET=your-secret-key
PORT=8000
\`\`\`

## 📋 Requirements

- Node.js 18+
- MongoDB (via Docker or local)
- External Game Generation API running on port 3001

---

**🦅 Claw API** - Simple, clean, and ready to use.
