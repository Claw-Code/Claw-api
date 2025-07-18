# 🦅 Claw API v2 - Complete Documentation

**The most advanced AI-powered game development API specializing in Phaser.js 2D games, now with real-time streaming and live previews.**

## 📋 Table of Contents

1. [🚀 Quick Start: The Streaming Workflow](#-quick-start-the-streaming-workflow)
2. [🔐 Authentication](#-authentication)
3. [📝 API Endpoints Reference](#-api-endpoints-reference)
4. [⚡ Real-Time Streaming (SSE)](#-real-time-streaming-sse)
5. [🎮 Game Generation Process](#-game-generation-process)
6. [📎 File Attachments](#-file-attachments)
7. [🔧 Error Handling](#-error-handling)
8. [💡 Complete Examples](#-complete-examples)

---

## 🚀 Quick Start: The Streaming Workflow

Claw API uses a modern, real-time streaming architecture similar to v0. Game generation happens in two steps:

### Step 1: Initiate Generation
Send a `POST` request to create a message. You'll immediately get a `streamUrl`.

### Step 2: Connect to Stream
Use the `streamUrl` with `EventSource` to receive real-time updates as the AI generates your game.

\`\`\`bash
# 1. Create message and get stream URL
curl -X POST http://localhost:8000/api/conversations/{id}/messages \
  -H "Authorization: Bearer $TOKEN" \
  -F "text=Create a space shooter game"

# Response: { "data": { "streamUrl": "/api/conversations/.../stream" } }

# 2. Connect to stream (in JavaScript)
const eventSource = new EventSource('http://localhost:8000' + streamUrl);
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type, data);
};
\`\`\`

---

## 🔐 Authentication

All endpoints (except `/health` and `/docs`) require JWT authentication:

\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

### Get Your Token

**POST /api/auth/login**
\`\`\`json
{
  "email": "developer@example.com",
  "password": "your_password"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "_id": "...", "username": "...", "email": "..." }
  }
}
\`\`\`

---

## 📝 API Endpoints Reference

### Authentication Endpoints

#### Register User
**POST /api/auth/register**

\`\`\`json
{
  "username": "game_developer_123",
  "email": "dev@example.com", 
  "password": "SecurePass123!"
}
\`\`\`

#### Login User  
**POST /api/auth/login**

\`\`\`json
{
  "email": "dev@example.com",
  "password": "SecurePass123!"
}
\`\`\`

#### Get Profile
**GET /api/auth/profile**
- Requires: `Authorization: Bearer <token>`

### Conversation Endpoints

#### Create Conversation
**POST /api/conversations**

\`\`\`json
{
  "title": "Space Shooter with Boss Battles"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Space Shooter with Boss Battles",
    "messages": [],
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
\`\`\`

#### List Conversations
**GET /api/conversations**

**Response:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Space Shooter with Boss Battles",
      "updatedAt": "2024-01-15T14:25:30.000Z"
    }
  ]
}
\`\`\`

#### Get Single Conversation
**GET /api/conversations/{conversationId}**

Returns complete conversation with all messages, LLM responses, and attachments.

#### Delete Conversation
**DELETE /api/conversations/{conversationId}**

Deletes an entire conversation, including all its messages and attachments. This action is irreversible.

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
\`\`\`

### Message Endpoints

#### Send Message (Initiate Stream)
**POST /api/conversations/{conversationId}/messages**

- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `text` (required): Your game prompt
  - `framework` (optional): Target framework (default: "phaser.js")
  - `attachments` (optional): Up to 5 files

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "messageId": "507f1f77bcf86cd799439013",
    "conversationId": "507f1f77bcf86cd799439012",
    "streamUrl": "/api/conversations/507f1f77bcf86cd799439012/messages/507f1f77bcf86cd799439013/stream"
  },
  "message": "Message sent successfully. Connect to streamUrl for real-time generation updates."
}
\`\`\`

#### Connect to Stream
**GET /api/conversations/{conversationId}/messages/{messageId}/stream**

- **Produces:** `text/event-stream`
- **Connection:** Server-Sent Events (SSE)

#### Edit Message
**PUT /api/conversations/{conversationId}/messages/{messageId}**

\`\`\`json
{
  "text": "Create a space shooter with boss battles and power-ups"
}
\`\`\`

Creates a new version while preserving history.

#### Get Message Attachments
**GET /api/conversations/{conversationId}/messages/{messageId}/attachments**

#### Download Attachment
**GET /api/conversations/{conversationId}/messages/{messageId}/attachments/{attachmentId}**

#### Delete Message
**DELETE /api/conversations/{conversationId}/messages/{messageId}**

Deletes a specific message and all its attachments. This action is irreversible.

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Message deleted successfully"
}
\`\`\`

### System Endpoints

#### Health Check
**GET /health**

\`\`\`json
{
  "status": "ok",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "services": {
    "database": "connected",
    "llmProviders": [
      { "name": "groq", "available": true },
      { "name": "huggingface", "available": true },
      { "name": "ollama", "available": false }
    ]
  }
}
\`\`\`

---

## ⚡ Real-Time Streaming (SSE)

Once connected to the stream URL, you'll receive events in this order:

### Connection Events
\`\`\`javascript
// 1. Connection established
{ "type": "connected", "timestamp": "2024-01-15T14:30:00.000Z" }

// Keep-alive pings (every 30 seconds)
{ "type": "ping", "timestamp": "2024-01-15T14:30:00.000Z" }
\`\`\`

### Generation Phase Events

#### 1. Thinking Phase
\`\`\`javascript
{ "type": "thinking", "content": "Analyzing your game requirements..." }
{ "type": "thinking_detail", "content": "Designing Phaser.js game structure..." }
\`\`\`

#### 2. Text Generation
\`\`\`javascript
{ "type": "text_start" }
{ "type": "text_chunk", "chunk": "# Space Shooter Game\n\nThis is an exciting...", "isComplete": false }
{ "type": "text_chunk", "chunk": " space shooter with...", "isComplete": true }
\`\`\`

#### 3. Code Generation
\`\`\`javascript
{ "type": "code_start", "totalFiles": 3 }

// For each file:
{ "type": "file_start", "fileName": "index.html", "fileType": "html", "description": "Main HTML file" }
{ "type": "file_chunk", "fileName": "index.html", "chunk": "<!DOCTYPE html>...", "progress": 25 }
{ "type": "file_complete", "fileName": "index.html", "file": { "path": "index.html", "content": "...", "type": "html" } }
\`\`\`

#### 4. Verification
\`\`\`javascript
{ "type": "verification", "content": "Verifying code quality and Phaser.js best practices..." }
\`\`\`

#### 5. Preview & Download
\`\`\`javascript
{ "type": "preview_start", "content": "🚀 Launching live preview environment..." }
{ "type": "preview_ready", "url": "http://localhost:3001", "buildLogs": ["Build completed"] }
{ "type": "download_ready", "url": "/api/download/abc123" }
\`\`\`

#### 6. Completion
\`\`\`javascript
{ "type": "generation_complete", "progress": 100 }
{ "type": "complete", "response": { /* Full LLMResponse object */ } }
{ "type": "end" }
\`\`\`

### Error Events
\`\`\`javascript
{ "type": "error", "error": "Error message", "details": "Additional context" }
{ "type": "preview_error", "error": "Build failed", "buildLogs": ["Error details"] }
\`\`\`

### Complete JavaScript Example
\`\`\`javascript
function connectToStream(streamUrl, token) {
  const eventSource = new EventSource(`${streamUrl}?token=${token}`);
  
  const state = {
    thinking: '',
    textContent: '',
    files: [],
    previewUrl: null,
    downloadUrl: null,
    isComplete: false
  };
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'connected':
        console.log('✅ Connected to stream');
        break;
        
      case 'thinking':
      case 'thinking_detail':
        state.thinking = data.content;
        updateUI('thinking', state.thinking);
        break;
        
      case 'text_chunk':
        state.textContent += data.chunk;
        updateUI('text', state.textContent);
        break;
        
      case 'file_start':
        state.files.push({
          path: data.fileName,
          type: data.fileType,
          content: '',
          description: data.description,
          isComplete: false
        });
        updateUI('files', state.files);
        break;
        
      case 'file_chunk':
        const fileIndex = state.files.findIndex(f => f.path === data.fileName);
        if (fileIndex !== -1) {
          state.files[fileIndex].content += data.chunk;
          updateUI('files', state.files);
        }
        break;
        
      case 'file_complete':
        const completedFileIndex = state.files.findIndex(f => f.path === data.fileName);
        if (completedFileIndex !== -1) {
          state.files[completedFileIndex] = { ...data.file, isComplete: true };
          updateUI('files', state.files);
        }
        break;
        
      case 'preview_ready':
        state.previewUrl = data.url;
        updateUI('preview', state.previewUrl);
        break;
        
      case 'download_ready':
        state.downloadUrl = data.url;
        updateUI('download', state.downloadUrl);
        break;
        
      case 'complete':
        state.isComplete = true;
        console.log('✅ Generation complete!', data.response);
        eventSource.close();
        break;
        
      case 'error':
        console.error('❌ Stream error:', data.error);
        eventSource.close();
        break;
        
      case 'end':
        console.log('🔚 Stream ended');
        eventSource.close();
        break;
        
      case 'ping':
        // Keep-alive, no action needed
        break;
        
      default:
        console.log('Unknown event type:', data.type);
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('EventSource failed:', error);
    eventSource.close();
  };
  
  return eventSource;
}

function updateUI(section, data) {
  // Update your UI based on the section and data
  console.log(`Updating ${section}:`, data);
}
\`\`\`

---

## 🎮 Game Generation Process

### LLM Response Structure

The final `complete` event contains a full `LLMResponse` object:

\`\`\`javascript
{
  "type": "complete",
  "response": {
    "textResponse": "# Space Shooter Game\n\nI've created an exciting space shooter...",
    "thinking": "I'll create a space shooter with modern Phaser.js patterns...",
    "codeResponse": {
      "files": [
        {
          "path": "index.html",
          "content": "<!DOCTYPE html>\n<html lang=\"en\">...",
          "type": "html",
          "language": "html"
        },
        {
          "path": "game.js", 
          "content": "class GameScene extends Phaser.Scene {...",
          "type": "js",
          "language": "javascript"
        },
        {
          "path": "assets.js",
          "content": "// Asset management utilities...",
          "type": "js", 
          "language": "javascript"
        }
      ],
      "framework": "phaser.js",
      "language": "javascript",
      "previewUrl": "http://localhost:3001",
      "downloadUrl": "/api/download/abc123"
    },
    "status": "completed",
    "provider": "groq",
    "version": 1,
    "createdAt": "2024-01-15T14:22:15.000Z"
  }
}
\`\`\`

### Generated Game Features

Every generated game includes:

- ✅ **Complete Phaser.js Setup**: Modern ES6+ syntax with proper scene management
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile devices
- ✅ **Touch Controls**: Mobile-friendly input handling
- ✅ **Physics System**: Arcade physics with collision detection
- ✅ **Asset Management**: Efficient loading and procedural generation
- ✅ **Performance Optimization**: Object pooling and memory management
- ✅ **Error Handling**: Robust error recovery and debugging
- ✅ **Cross-browser Compatibility**: Works in all modern browsers

---

## 📎 File Attachments

### Supported File Types

| Category | Extensions | Max Size | Purpose |
|----------|------------|----------|---------|
| **Images** | `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg` | 10MB each | Game mockups, sprite references |
| **Code** | `.js`, `.ts`, `.html`, `.css`, `.json` | 5MB each | Reference code, configurations |
| **Documents** | `.txt`, `.md`, `.pdf` | 10MB each | Game design documents |
| **Audio** | `.mp3`, `.wav`, `.ogg` | 25MB each | Sound effect references |
| **Archives** | `.zip`, `.tar.gz` | 50MB each | Asset packages, projects |

### Upload Limits

- **Maximum files per message**: 5
- **Total size per message**: 50MB
- **Individual file size**: 50MB

### How Attachments Are Used

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

### Standard Error Response Format

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

### Streaming Error Events

Errors during streaming are sent as events:

\`\`\`javascript
{
  "type": "error",
  "error": "LLM generation failed",
  "details": "All LLM providers are currently unavailable. Please try again later."
}
\`\`\`

---

## 💡 Complete Examples

### Full Workflow Example

\`\`\`bash
#!/bin/bash

# Complete game generation workflow
API_BASE="http://localhost:8000"

echo "🔐 Step 1: Register and login..."

# Register user
REGISTER_RESPONSE=$(curl -s -X POST $API_BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "game_dev_pro",
    "email": "developer@example.com", 
    "password": "SecurePass123!"
  }')

echo "✅ User registered"

# Login to get token
LOGIN_RESPONSE=$(curl -s -X POST $API_BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@example.com",
    "password": "SecurePass123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
echo "✅ Token obtained: ${TOKEN:0:20}..."

echo "💬 Step 2: Create conversation..."

# Create conversation
CONVERSATION_RESPONSE=$(curl -s -X POST $API_BASE/api/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Epic Space Shooter with Boss Battles"
  }')

CONVERSATION_ID=$(echo $CONVERSATION_RESPONSE | jq -r '.data._id')
echo "✅ Conversation created: $CONVERSATION_ID"

echo "🎮 Step 3: Generate game..."

# Send message to generate game
MESSAGE_RESPONSE=$(curl -s -X POST $API_BASE/api/conversations/$CONVERSATION_ID/messages \
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

STREAM_URL=$(echo $MESSAGE_RESPONSE | jq -r '.data.streamUrl')
echo "✅ Stream initiated: $STREAM_URL"

echo "📡 Step 4: Connect to stream..."
echo "Connect your EventSource client to: $API_BASE$STREAM_URL"
echo ""
echo "🎯 Example JavaScript connection:"
echo "const eventSource = new EventSource('$API_BASE$STREAM_URL');"
echo "eventSource.onmessage = (event) => {"
echo "  const data = JSON.parse(event.data);"
echo "  console.log('Event:', data.type, data);"
echo "};"
\`\`\`

### React Hook Example

\`\`\`javascript
// useClawAPI.js - React hook for Claw API integration
import { useState, useCallback } from 'react';

export function useClawAPI(apiBase = 'http://localhost:8000') {
  const [token, setToken] = useState(localStorage.getItem('claw_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setToken(data.data.token);
        localStorage.setItem('claw_token', data.data.token);
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const createConversation = useCallback(async (title) => {
    if (!token) throw new Error('Not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiBase}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiBase, token]);

  const sendMessage = useCallback(async (conversationId, text, attachments = []) => {
    if (!token) throw new Error('Not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('framework', 'phaser.js');
      
      attachments.forEach((file, index) => {
        formData.append('attachments', file);
      });
      
      const response = await fetch(`${apiBase}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiBase, token]);

  const connectToStream = useCallback((streamUrl, onEvent) => {
    if (!token) throw new Error('Not authenticated');
    
    const fullUrl = `${apiBase}${streamUrl}?token=${token}`;
    const eventSource = new EventSource(fullUrl);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent(data);
      } catch (err) {
        console.error('Failed to parse stream event:', err);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setError('Stream connection failed');
    };
    
    return eventSource;
  }, [apiBase, token]);

  return {
    token,
    loading,
    error,
    login,
    createConversation,
    sendMessage,
    connectToStream,
    isAuthenticated: !!token
  };
}
\`\`\`

### Complete React Component Example

\`\`\`jsx
// GameGenerator.jsx - Complete React component
import React, { useState } from 'react';
import { useClawAPI } from './useClawAPI';

export function GameGenerator() {
  const { login, createConversation, sendMessage, connectToStream, isAuthenticated, loading, error } = useClawAPI();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gamePrompt, setGamePrompt] = useState('');
  const [streamState, setStreamState] = useState({
    thinking: '',
    textContent: '',
    files: [],
    previewUrl: null,
    downloadUrl: null,
    isComplete: false
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleGenerateGame = async (e) => {
    e.preventDefault();
    
    try {
      // Create conversation
      const conversation = await createConversation(`Game: ${gamePrompt.slice(0, 50)}...`);
      
      // Send message
      const messageData = await sendMessage(conversation._id, gamePrompt);
      
      // Connect to stream
      const eventSource = connectToStream(messageData.streamUrl, (event) => {
        setStreamState(prev => {
          const newState = { ...prev };
          
          switch (event.type) {
            case 'thinking':
            case 'thinking_detail':
              newState.thinking = event.content;
              break;
              
            case 'text_chunk':
              newState.textContent += event.chunk;
              break;
              
            case 'file_start':
              newState.files.push({
                path: event.fileName,
                type: event.fileType,
                content: '',
                isComplete: false
              });
              break;
              
            case 'file_chunk':
              const fileIndex = newState.files.findIndex(f => f.path === event.fileName);
              if (fileIndex !== -1) {
                newState.files[fileIndex].content += event.chunk;
              }
              break;
              
            case 'file_complete':
              const completedIndex = newState.files.findIndex(f => f.path === event.fileName);
              if (completedIndex !== -1) {
                newState.files[completedIndex] = { ...event.file, isComplete: true };
              }
              break;
              
            case 'preview_ready':
              newState.previewUrl = event.url;
              break;
              
            case 'download_ready':
              newState.downloadUrl = event.url;
              break;
              
            case 'complete':
              newState.isComplete = true;
              eventSource.close();
              break;
              
            case 'error':
              console.error('Generation error:', event.error);
              eventSource.close();
              break;
          }
          
          return newState;
        });
      });
      
    } catch (err) {
      console.error('Game generation failed:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Login to Claw API</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6">
      <h1 className="text-3xl font-bold mb-6">🦅 Claw API Game Generator</h1>
      
      <form onSubmit={handleGenerateGame} className="mb-8">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Describe your game:</label>
          <textarea
            value={gamePrompt}
            onChange={(e) => setGamePrompt(e.target.value)}
            placeholder="Create a space shooter with enemy ships, power-ups, and boss battles..."
            className="w-full p-3 border rounded h-32"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Game'}
        </button>
      </form>

      {/* Stream Status */}
      {streamState.thinking && (
        <div className="mb-4 p-4 bg-blue-50 rounded">
          <h3 className="font-medium text-blue-800">🧠 AI Thinking</h3>
          <p className="text-blue-600">{streamState.thinking}</p>
        </div>
      )}

      {/* Text Content */}
      {streamState.textContent && (
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">📝 Game Documentation</h3>
          <div className="whitespace-pre-wrap">{streamState.textContent}</div>
        </div>
      )}

      {/* Generated Files */}
      {streamState.files.length > 0 && (
        <div className="mb-4">
          <h3 className="font-medium mb-2">📁 Generated Files ({streamState.files.length})</h3>
          <div className="space-y-2">
            {streamState.files.map((file, index) => (
              <div key={index} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm">{file.path}</span>
                  <span className={`text-xs px-2 py-1 rounded ${file.isComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {file.isComplete ? 'Complete' : 'Generating...'}
                  </span>
                </div>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-32">
                  <code>{file.content}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview and Download */}
      <div className="flex gap-4">
        {streamState.previewUrl && (
          <a
            href={streamState.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            🎮 Play Game
          </a>
        )}
        {streamState.downloadUrl && (
          <a
            href={streamState.downloadUrl}
            download
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            📦 Download ZIP
          </a>
        )}
      </div>

      {streamState.isComplete && (
        <div className="mt-4 p-4 bg-green-50 rounded">
          <h3 className="font-medium text-green-800">✅ Generation Complete!</h3>
          <p className="text-green-600">Your Phaser.js game has been generated successfully.</p>
        </div>
      )}
    </div>
  );
}
\`\`\`

---

## 🎯 Best Practices

### 1. Connection Management
- Always close EventSource connections when done
- Handle connection errors gracefully
- Implement reconnection logic for production apps

### 2. UI Updates
- Update UI incrementally as stream events arrive
- Show progress indicators during generation
- Provide clear status messages to users

### 3. Error Handling
- Handle both HTTP errors and stream errors
- Provide meaningful error messages to users
- Implement retry logic for failed requests

### 4. Performance
- Debounce rapid UI updates during streaming
- Use efficient state management for large files
- Implement proper cleanup in React components

---

**🦅 Claw API v2** - Empowering game developers with AI-powered, real-time code generation.

For more examples and advanced usage, visit our [GitHub repository](https://github.com/your-repo/claw-api) or check the interactive documentation at `/docs`.
