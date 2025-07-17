# 🦅 Claw API v2 - Complete Documentation

**The most advanced AI-powered game development API specializing in Phaser.js 2D games.**

## 📋 Table of Contents

1. [🚀 Quick Start](#-quick-start)
2. [🔐 Authentication](#-authentication)
3. [📝 API Endpoints](#-api-endpoints)
4. [📊 Request/Response Formats](#-requestresponse-formats)
5. [🎮 Game Generation](#-game-generation)
6. [📎 File Attachments](#-file-attachments)
7. [🔧 Error Handling](#-error-handling)
8. [📈 Rate Limits](#-rate-limits)
9. [💡 Examples](#-examples)
10. [🛠️ SDKs & Tools](#️-sdks--tools)

---

## 🚀 Quick Start

### Base URL
- **Development**: `http://localhost:8000`
- **Production**: `https://your-domain.com`

### Authentication
All endpoints except `/health` and `/docs` require JWT authentication:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

### Basic Workflow
1. **Register/Login** → Get JWT token
2. **Create Conversation** → Start a new game project
3. **Send Message** → Request game generation
4. **Get Response** → Receive structured text + code
5. **Download** → Get ZIP file for deployment

---

## 🔐 Authentication

### Register User
**POST** `/api/auth/register`

**Request Body:**
\`\`\`json
{
  "username": "game_developer_123",     // string, 3-50 chars, alphanumeric + underscore
  "email": "dev@example.com",           // string, valid email format
  "password": "SecurePass123!"          // string, min 6 characters
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "game_developer_123",
    "email": "dev@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "User registered successfully"
}
\`\`\`

**Possible Errors:**
- `409 Conflict` - Email already exists
- `400 Bad Request` - Invalid input data

### Login User
**POST** `/api/auth/login`

**Request Body:**
\`\`\`json
{
  "email": "dev@example.com",           // string, registered email
  "password": "SecurePass123!"          // string, user password
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // JWT token (expires in 7 days)
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "game_developer_123",
      "email": "dev@example.com"
    }
  },
  "message": "Login successful"
}
\`\`\`

**Possible Errors:**
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Missing email/password

### Get User Profile
**GET** `/api/auth/profile`

**Headers:**
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "game_developer_123",
    "email": "dev@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
\`\`\`

---

## 📝 API Endpoints

### Conversations

#### Create Conversation
**POST** `/api/conversations`

**Request Body:**
\`\`\`json
{
  "title": "Space Shooter with Boss Battles"  // string, 1-200 chars, your game idea
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "title": "Space Shooter with Boss Battles",
    "messages": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
\`\`\`

#### List Conversations
**GET** `/api/conversations`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Space Shooter with Boss Battles",
      "updatedAt": "2024-01-15T14:25:30.000Z",
      "messageCount": 8,
      "lastMessage": "Can you add particle effects to the explosions?"
    }
  ]
}
\`\`\`

#### Get Conversation Details
**GET** `/api/conversations/{conversationId}`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "title": "Space Shooter with Boss Battles",
    "messages": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "role": "user",
        "content": [
          {
            "version": 1,
            "text": "Create a space shooter game with enemy ships and power-ups",
            "editedAt": "2024-01-15T14:20:00.000Z"
          }
        ],
        "attachments": [],
        "createdAt": "2024-01-15T14:20:00.000Z",
        "updatedAt": "2024-01-15T14:20:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439014",
        "role": "assistant",
        "content": [],
        "llmResponse": [
          {
            "version": 1,
            "provider": "groq",
            "textResponse": "# 🚀 Space Shooter Game\n\nI've created an exciting space shooter...",
            "codeResponse": {
              "files": [
                {
                  "path": "index.html",
                  "content": "<!DOCTYPE html>...",
                  "type": "html",
                  "language": "html",
                  "size": 1024,
                  "description": "Main HTML file with Phaser.js setup"
                },
                {
                  "path": "game.js",
                  "content": "class GameScene extends Phaser.Scene...",
                  "type": "js",
                  "language": "javascript",
                  "size": 15420,
                  "description": "Main game logic with scenes and gameplay"
                }
              ],
              "framework": "phaser.js",
              "language": "javascript",
              "gameFeatures": ["Physics System", "Particle Effects", "Mobile Controls"],
              "downloadUrl": "/api/download/abc123",
              "instructions": "1. Download ZIP\n2. Extract files\n3. Open index.html"
            },
            "status": "verified",
            "createdAt": "2024-01-15T14:22:15.000Z",
            "metrics": {
              "generationTime": 12.5,
              "codeLines": 245,
              "filesGenerated": 3
            }
          }
        ],
        "createdAt": "2024-01-15T14:22:00.000Z",
        "updatedAt": "2024-01-15T14:22:15.000Z"
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:25:30.000Z"
  }
}
\`\`\`

### Messages

#### Send Message (with optional file attachments)
**POST** `/api/conversations/{conversationId}/messages`

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `text` (required): Your game development request
- `framework` (optional): Target framework (default: "phaser.js")
- `attachments` (optional): Up to 5 files (max 50MB total)

**Example Request:**
\`\`\`bash
curl -X POST http://localhost:8000/api/conversations/507f1f77bcf86cd799439012/messages \
  -H "Authorization: Bearer <your_token>" \
  -F "text=Create a space shooter game with enemy ships, power-ups, particle effects, and mobile controls. Include a scoring system and multiple enemy types." \
  -F "framework=phaser.js" \
  -F "attachments=@game-mockup.png" \
  -F "attachments=@reference-code.js"
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "conversationId": "507f1f77bcf86cd799439012",
    "role": "user",
    "content": [
      {
        "version": 1,
        "text": "Create a space shooter game with enemy ships, power-ups...",
        "editedAt": "2024-01-15T14:20:00.000Z"
      }
    ],
    "attachments": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "filename": "game-mockup.png",
        "originalName": "game-mockup.png",
        "mimetype": "image/png",
        "size": 245760,
        "downloadUrl": "/api/conversations/507f1f77bcf86cd799439012/messages/507f1f77bcf86cd799439013/attachments/507f1f77bcf86cd799439015"
      }
    ],
    "createdAt": "2024-01-15T14:20:00.000Z",
    "updatedAt": "2024-01-15T14:20:00.000Z"
  },
  "message": "Message sent successfully. AI response is being generated..."
}
\`\`\`

#### Edit Message
**PUT** `/api/conversations/{conversationId}/messages/{messageId}`

**Request Body:**
\`\`\`json
{
  "text": "Create a space shooter game with enemy ships, power-ups, boss battles, and a high score system."
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "content": [
      {
        "version": 1,
        "text": "Create a space shooter game with enemy ships and power-ups",
        "editedAt": "2024-01-15T14:20:00.000Z"
      },
      {
        "version": 2,
        "text": "Create a space shooter game with enemy ships, power-ups, boss battles, and a high score system.",
        "editedAt": "2024-01-15T14:25:30.000Z"
      }
    ],
    "updatedAt": "2024-01-15T14:25:30.000Z"
  }
}
\`\`\`

### File Attachments

#### Get Message Attachments
**GET** `/api/conversations/{conversationId}/messages/{messageId}/attachments`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "messageId": "507f1f77bcf86cd799439013",
      "filename": "game-mockup.png",
      "originalName": "game-mockup.png",
      "mimetype": "image/png",
      "size": 245760,
      "uploadedAt": "2024-01-15T14:20:30.000Z",
      "downloadUrl": "/api/conversations/.../attachments/507f1f77bcf86cd799439015"
    }
  ]
}
\`\`\`

#### Download Attachment
**GET** `/api/conversations/{conversationId}/messages/{messageId}/attachments/{attachmentId}`

**Response:** Binary file download with appropriate headers

### Downloads

#### Download Generated Game
**GET** `/api/download/{downloadId}`

**Response:** ZIP file download containing all generated game files

**Example:**
\`\`\`bash
curl -X GET http://localhost:8000/api/download/abc123 \
  -H "Authorization: Bearer <your_token>" \
  -o my-space-shooter-game.zip
\`\`\`

### System

#### Health Check
**GET** `/health`

**Response (200):**
\`\`\`json
{
  "status": "ok",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "uptime": 86400.5,
  "version": "2.0.0",
  "responseTime": 15,
  "services": {
    "database": "connected",
    "llmProviders": [
      {
        "name": "groq",
        "status": "available",
        "responseTime": 1.2
      },
      {
        "name": "huggingface", 
        "status": "available",
        "responseTime": 2.1
      },
      {
        "name": "ollama",
        "status": "unavailable",
        "responseTime": 0
      }
    ]
  },
  "environment": "development",
  "features": {
    "phaserGeneration": true,
    "fileUploads": true,
    "messageVersioning": true,
    "selfCorrection": true,
    "mobileOptimization": true
  }
}
\`\`\`

#### API Status
**GET** `/api/status`

**Response (200):**
\`\`\`json
{
  "api": {
    "name": "Claw API",
    "version": "2.0.0",
    "description": "AI-Powered Phaser.js Game Development API",
    "documentation": "/docs",
    "repository": "https://github.com/your-repo/claw-api"
  },
  "capabilities": {
    "gameFrameworks": ["phaser.js"],
    "llmProviders": ["groq", "huggingface", "ollama"],
    "features": [
      "AI Code Generation",
      "Self-Correction Loop",
      "File Attachments",
      "Message Versioning",
      "Mobile Optimization",
      "Real-time Preview",
      "ZIP Downloads"
    ],
    "gameTypes": [
      "Space Shooters",
      "Platformers", 
      "Puzzle Games",
      "Endless Runners",
      "Arcade Games",
      "Custom Games"
    ]
  },
  "limits": {
    "maxFileSize": "50MB",
    "maxFilesPerMessage": 5,
    "maxConversationsPerUser": 100,
    "maxMessageLength": 5000,
    "rateLimitGeneral": "10 req/sec",
    "rateLimitGeneration": "5 req/sec",
    "tokenExpiry": "7 days"
  }
}
\`\`\`

---

## 📊 Request/Response Formats

### Standard Success Response
\`\`\`json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T14:30:00.000Z"
}
\`\`\`

### Standard Error Response
\`\`\`json
{
  "success": false,
  "error": "ErrorType",
  "message": "Human-readable error description",
  "details": {
    "field": "email",
    "code": "DUPLICATE_EMAIL",
    "suggestion": "Try logging in instead, or use a different email address"
  },
  "timestamp": "2024-01-15T14:30:00.000Z"
}
\`\`\`

### Variable Types Reference

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text data | `"Hello World"` |
| `integer` | Whole number | `42` |
| `number` | Decimal number | `3.14` |
| `boolean` | True/false | `true` |
| `array` | List of items | `["item1", "item2"]` |
| `object` | Key-value pairs | `{"key": "value"}` |
| `date-time` | ISO 8601 timestamp | `"2024-01-15T14:30:00.000Z"` |
| `uri` | URL/URI | `"https://example.com"` |
| `email` | Email address | `"user@example.com"` |
| `binary` | File data | File upload |

---

## 🎮 Game Generation

### Supported Game Types

1. **🚀 Space Shooters**
   - Enemy waves and AI patterns
   - Power-ups and weapon upgrades
   - Boss battles with multiple phases
   - Particle effects and explosions
   - Scoring and high score systems

2. **🏃 Platformers**
   - Jumping and movement mechanics
   - Collectible items and coins
   - Moving platforms and obstacles
   - Multiple levels and checkpoints
   - Enemy AI and collision detection

3. **🧩 Puzzle Games**
   - Match-3 and tile-matching mechanics
   - Logic-based gameplay
   - Smooth animations and transitions
   - Score systems and combos
   - Progressive difficulty

4. **🏃‍♂️ Endless Runners**
   - Procedural level generation
   - Obstacle avoidance mechanics
   - Power-ups and collectibles
   - Increasing difficulty curves
   - Mobile-optimized controls

5. **🎯 Arcade Games**
   - Classic game mechanics
   - Simple but engaging gameplay
   - Retro-style graphics and sounds
   - High score competitions
   - Quick play sessions

### Generated Code Structure

Every generated game includes:

\`\`\`
game-project/
├── index.html          # Main HTML file with Phaser.js CDN
├── game.js            # Complete game logic and scenes
├── assets.js          # Asset generation and management (optional)
├── styles.css         # Custom styling (optional)
└── README.md          # Instructions and documentation
\`\`\`

### Game Features Automatically Included

- ✅ **Responsive Design**: Works on desktop and mobile
- ✅ **Touch Controls**: Mobile-friendly input handling
- ✅ **Performance Optimization**: Efficient rendering and memory management
- ✅ **Error Handling**: Robust error recovery and debugging
- ✅ **Modern JavaScript**: ES6+ syntax and best practices
- ✅ **Cross-browser Compatibility**: Works in all modern browsers
- ✅ **Asset Management**: Efficient loading and caching
- ✅ **Physics Integration**: Collision detection and realistic movement
- ✅ **Animation System**: Smooth tweens and sprite animations
- ✅ **Audio Support**: Sound effects and background music placeholders

---

## 📎 File Attachments

### Supported File Types

| Category | Extensions | Max Size | Purpose |
|----------|------------|----------|---------|
| **Images** | `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg` | 10MB each | Game mockups, sprite references, UI designs |
| **Code** | `.js`, `.ts`, `.html`, `.css`, `.json` | 5MB each | Reference code, configuration files |
| **Documents** | `.txt`, `.md`, `.pdf` | 10MB each | Game design documents, specifications |
| **Audio** | `.mp3`, `.wav`, `.ogg` | 25MB each | Sound effect references, music samples |
| **Archives** | `.zip`, `.tar.gz` | 50MB each | Asset packages, existing projects |

### Upload Limits

- **Maximum files per message**: 5
- **Total size per message**: 50MB
- **Individual file size**: 50MB
- **Supported MIME types**: Automatically detected

### File Processing

1. **Images**: Analyzed for visual references and UI mockups
2. **Code Files**: Parsed for patterns and implementation ideas
3. **Documents**: Extracted for game design requirements
4. **Audio**: Referenced for sound design inspiration
5. **Archives**: Extracted and analyzed for existing assets

---

## 🔧 Error Handling

### HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid request data |
| `401` | Unauthorized | Missing or invalid authentication |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `409` | Conflict | Resource already exists |
| `413` | Payload Too Large | File size exceeded |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |
| `503` | Service Unavailable | Service temporarily down |

### Error Response Details

\`\`\`json
{
  "success": false,
  "error": "ValidationError",
  "message": "The provided email address is already registered",
  "details": {
    "field": "email",
    "code": "DUPLICATE_EMAIL",
    "suggestion": "Try logging in instead, or use a different email address",
    "validationErrors": [
      {
        "field": "email",
        "message": "Email must be unique",
        "value": "existing@example.com"
      }
    ]
  },
  "timestamp": "2024-01-15T14:30:00.000Z",
  "requestId": "req_abc123def456"
}
\`\`\`

### Common Error Scenarios

1. **Authentication Errors**
   \`\`\`json
   {
     "error": "AuthenticationError",
     "message": "JWT token has expired",
     "details": {
       "code": "TOKEN_EXPIRED",
       "suggestion": "Please log in again to get a new token"
     }
   }
   \`\`\`

2. **Validation Errors**
   \`\`\`json
   {
     "error": "ValidationError", 
     "message": "Request validation failed",
     "details": {
       "validationErrors": [
         {
           "field": "title",
           "message": "Title must be between 1 and 200 characters",
           "value": ""
         }
       ]
     }
   }
   \`\`\`

3. **Rate Limit Errors**
   \`\`\`json
   {
     "error": "RateLimitError",
     "message": "Too many requests. Please try again later.",
     "details": {
       "limit": "5 requests per second",
       "resetTime": "2024-01-15T14:31:00.000Z",
       "suggestion": "Wait 60 seconds before making another request"
     }
   }
   \`\`\`

4. **File Upload Errors**
   \`\`\`json
   {
     "error": "FileUploadError",
     "message": "File size exceeds maximum allowed size",
     "details": {
       "maxSize": "50MB",
       "actualSize": "75MB",
       "filename": "large-asset-pack.zip",
       "suggestion": "Compress the file or split into smaller parts"
     }
   }
   \`\`\`

---

## 📈 Rate Limits

### Current Limits

| Endpoint Category | Limit | Window | Scope |
|------------------|-------|---------|-------|
| **General API** | 10 requests | 1 second | Per IP |
| **Authentication** | 5 requests | 1 minute | Per IP |
| **Game Generation** | 5 requests | 1 second | Per IP |
| **File Upload** | 3 requests | 1 minute | Per User |
| **Downloads** | 20 requests | 1 minute | Per User |

### Rate Limit Headers

All responses include rate limit information:

\`\`\`
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1642248000
X-RateLimit-Window: 1
\`\`\`

### Handling Rate Limits

When rate limited, you'll receive a `429` response:

\`\`\`json
{
  "success": false,
  "error": "RateLimitError",
  "message": "Rate limit exceeded",
  "details": {
    "limit": "5 requests per second",
    "resetTime": "2024-01-15T14:31:00.000Z",
    "retryAfter": 60
  }
}
\`\`\`

**Best Practices:**
- Implement exponential backoff
- Cache responses when possible
- Use webhooks for long-running operations
- Monitor rate limit headers

---

## 💡 Examples

### Complete Game Generation Workflow

\`\`\`bash
#!/bin/bash

# 1. Register a new user
echo "🔐 Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "game_dev_pro",
    "email": "developer@example.com",
    "password": "SecurePass123!"
  }')

echo "✅ User registered: $REGISTER_RESPONSE"

# 2. Login to get token
echo "🔑 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@example.com",
    "password": "SecurePass123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
echo "✅ Token obtained: ${TOKEN:0:20}..."

# 3. Create a new conversation
echo "💬 Creating conversation..."
CONVERSATION_RESPONSE=$(curl -s -X POST http://localhost:8000/api/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Epic Space Shooter with Boss Battles"
  }')

CONVERSATION_ID=$(echo $CONVERSATION_RESPONSE | jq -r '.data._id')
echo "✅ Conversation created: $CONVERSATION_ID"

# 4. Send game generation request
echo "🎮 Generating game..."
MESSAGE_RESPONSE=$(curl -s -X POST http://localhost:8000/api/conversations/$CONVERSATION_ID/messages \
  -H "Authorization: Bearer $TOKEN" \
  -F "text=Create an epic space shooter game with the following features:
  
  - Player spaceship with smooth movement (arrow keys + WASD)
  - Multiple enemy types with different AI patterns
  - Power-ups: shield, rapid fire, score multiplier
  - Boss battles with multiple phases
  - Particle effects for explosions and engine trails
  - Progressive difficulty with enemy waves
  - High score system with local storage
  - Mobile touch controls for cross-platform play
  - Retro-style graphics with modern polish
  - Sound effects and background music placeholders
  
  Make it engaging and fun to play!" \
  -F "framework=phaser.js")

echo "✅ Game generation started: $MESSAGE_RESPONSE"

# 5. Wait a moment for generation to complete
echo "⏳ Waiting for generation to complete..."
sleep 15

# 6. Get the conversation with generated game
echo "📥
