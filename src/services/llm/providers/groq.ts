import type { LLMProvider } from "../../../types"

export class GroqProvider implements LLMProvider {
  name = "Groq"
  private apiKey: string
  private baseUrl = "https://api.groq.com/openai/v1"
  private logs: string[] = []

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || ""
  }

  private log(message: string) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] GROQ: ${message}`
    this.logs.push(logMessage)
    console.log(logMessage)

    // Keep only last 20 logs
    if (this.logs.length > 20) {
      this.logs = this.logs.slice(-20)
    }
  }

  getLogs(): string[] {
    return [...this.logs]
  }

  async generate(prompt: string, context?: any): Promise<string> {
    this.log("🚀 Starting generation...")
    this.log(`📝 Prompt length: ${prompt.length}`)
    this.log(`🔑 API Key configured: ${this.apiKey ? "Yes" : "No"}`)

    if (!this.apiKey) {
      const error = "GROQ_API_KEY is not configured"
      this.log(`❌ ${error}`)
      throw new Error(error)
    }

    // Use Llama model for free tier
    const model = context?.model || "llama3-8b-8192"
    this.log(`🤖 Using model: ${model}`)

    const requestBody = {
      model,
      messages: [
        {
          role: "system",
          content: this.getPhaserSystemPrompt(),
        },
        {
          role: "user",
          content: this.formatPromptForPhaser(prompt, context),
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      stream: false,
    }

    this.log("📤 Sending request to Groq API...")

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      this.log(`📥 Groq API response status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        this.log(`❌ Groq API error: ${errorText}`)
        throw new Error(`Groq API error (${response.status}): ${errorText}`)
      }

      const result = await response.json()
      this.log("✅ Groq API response received")

      const content = result.choices[0]?.message?.content || ""
      this.log(`📄 Response content length: ${content.length}`)
      this.log(`🔍 First 200 chars: ${content.substring(0, 200)}`)

      const parsedResponse = this.parseStructuredResponse(content)
      this.log("✅ Response parsed and structured")

      return parsedResponse
    } catch (error) {
      this.log(`❌ Request failed: ${error}`)
      throw error
    }
  }

  async isAvailable(): Promise<boolean> {
    this.log("🔍 Checking availability...")

    if (!this.apiKey) {
      this.log("❌ No API key configured")
      return false
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })
      const available = response.ok
      this.log(`✅ Availability check: ${available ? "available" : "unavailable"}`)
      return available
    } catch (error) {
      this.log(`❌ Availability check failed: ${error}`)
      return false
    }
  }

  private getPhaserSystemPrompt(): string {
    return `You are Claw AI, a world-class expert game developer specializing exclusively in creating 2D games with Phaser.js.

Your expertise includes:
- **Phaser.js 3.x** - The latest version with modern ES6+ syntax
- **NPM Package Integration** - Using the official Phaser npm package
- **Game Architecture** - Proper scene management, game states, and object-oriented design
- **Asset Management** - Efficient loading, caching, and optimization of sprites, sounds, and animations
- **Physics Systems** - Arcade Physics, Matter.js integration, collision detection
- **Performance** - Optimized rendering, object pooling, memory management

## CRITICAL REQUIREMENTS:
- You MUST generate code that works with the Phaser npm package (import Phaser from 'phaser')
- You MUST create complete, runnable games that work immediately
- You MUST include proper HTML file that loads the JavaScript
- You MUST use modern ES6+ modules and imports
- You MUST generate games that are fun and engaging to play

## Code Structure Requirements:
1. **index.html** - Must include Phaser via CDN AND support for ES6 modules
2. **game.js** - Main game file using proper Phaser imports and modern syntax
3. **All code must be production-ready and error-free**

IMPORTANT: Always respond in this exact JSON format:
{
  "thinking": "Your detailed thought process for the Phaser.js game design, architecture, and implementation strategy.",
  "textResponse": "Your comprehensive explanation of the game mechanics, controls, features, and how to play. Include technical details about the Phaser.js implementation.",
  "codeResponse": {
    "files": [
      {
        "path": "index.html",
        "content": "// Complete HTML file with Phaser.js CDN and ES6 module support",
        "type": "html",
        "language": "html"
      },
      {
        "path": "game.js",
        "content": "// Complete Phaser.js game code with proper imports",
        "type": "js",
        "language": "javascript"
      }
    ],
    "framework": "phaser.js",
    "language": "javascript"
  }
}`
  }

  private formatPromptForPhaser(prompt: string, context?: any): string {
    let formattedPrompt = `Create a 2D game using ONLY Phaser.js 3.x for the following request: ${prompt}

## Requirements:
- Use ONLY Phaser.js 3.x functions and APIs
- Create a complete, playable game with engaging mechanics
- Include proper game architecture with scenes and states
- Add cool visual effects (particles, tweens, animations)
- Implement comprehensive error handling
- Use modern JavaScript (ES6+) with proper class structure
- Include asset generation code for sprites and sounds
- Add proper physics and collision detection
- Implement smooth controls and responsive gameplay
- Include win/lose conditions and scoring system
- Add sound effects and background music placeholders
- Optimize for performance and mobile devices

## Technical Requirements:
- Proper scene management and transitions
- Object pooling for performance optimization
- Asset preloading with progress indicators
- Error handling for missing assets or failed operations
- Memory management and cleanup
- Scalable architecture for easy expansion
- Cross-browser compatibility
- Mobile-first responsive design

## Deliverables:
Please provide:
1. **Complete HTML file** with Phaser.js CDN and proper structure
2. **Main game JavaScript file** with all game logic and scenes
3. **Comprehensive documentation** explaining the game mechanics and code structure

The game should be immediately playable in a browser and demonstrate professional game development practices.`

    const attachments = context?.attachments || []

    if (attachments.length > 0) {
      formattedPrompt += `\n\n## Context from uploaded files:\n`
      attachments.forEach((attachment: any, index: number) => {
        formattedPrompt += `\n**File ${index + 1} (${attachment.filename}):**\n${attachment.content}\n`
      })
    }

    return formattedPrompt
  }

  private parseStructuredResponse(content: string): string {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content)
      return JSON.stringify(parsed)
    } catch {
      // If not JSON, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1])
          return JSON.stringify(parsed)
        } catch {
          // Fall back to creating structured response
          return JSON.stringify({
            thinking: "Processing the Phaser.js game request with advanced game development patterns...",
            textResponse: content,
            codeResponse: {
              files: this.extractCodeFiles(content),
              framework: "phaser.js",
              language: "javascript",
            },
          })
        }
      }

      // Last resort: create structured response from plain text
      return JSON.stringify({
        thinking: "Analyzing the game requirements and designing a comprehensive Phaser.js solution...",
        textResponse: content,
        codeResponse: {
          files: this.extractCodeFiles(content),
          framework: "phaser.js",
          language: "javascript",
        },
      })
    }
  }

  private extractCodeFiles(content: string): any[] {
    const codeBlocks = content.match(/```[\w]*\n([\s\S]*?)\n```/g) || []
    const files: any[] = []

    codeBlocks.forEach((block, index) => {
      const langMatch = block.match(/```(\w+)/)
      const language = langMatch ? langMatch[1] : "javascript"
      const code = block.replace(/```[\w]*\n/, "").replace(/\n```$/, "")

      // Determine file type and extension
      let extension = "js"
      let type = "js"
      let filename = `game-${index + 1}`

      if (language === "html" || code.includes("<!DOCTYPE") || code.includes("<html")) {
        extension = "html"
        type = "html"
        filename = "index"
      } else if (language === "css" || code.includes("body {") || code.includes("@media")) {
        extension = "css"
        type = "css"
        filename = "styles"
      } else if (code.includes("class") && code.includes("extends Phaser.Scene")) {
        filename = "game"
      }

      files.push({
        path: `${filename}.${extension}`,
        content: code,
        type,
        language: language === "javascript" || language === "js" ? "javascript" : language,
      })
    })

    // If no code blocks found, create default npm-compatible Phaser.js files
    if (files.length === 0) {
      files.push(
        {
          path: "index.html",
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phaser Game</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #2c3e50;
            font-family: Arial, sans-serif;
        }
        canvas {
            border: 2px solid #34495e;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
    <script type="module" src="game.js"></script>
</body>
</html>`,
          type: "html",
          language: "html",
        },
        {
          path: "game.js",
          content: `// Phaser.js Game - NPM Compatible
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    preload() {
        // Create simple colored rectangles as sprites
        this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        this.load.image('ground', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }
    
    create() {
        // Create ground platform
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'ground').setScale(800, 64).refreshBody();
        
        // Create player
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setDisplaySize(32, 48);
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.player.setTint(0x00ff00); // Green color
        
        // Player physics
        this.physics.add.collider(this.player, this.platforms);
        
        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        
        // Instructions
        this.add.text(16, 16, 'Use Arrow Keys or WASD to move\\nSpace to jump', {
            fontSize: '18px',
            fill: '#ffffff'
        });
        
        // Mobile touch controls
        this.input.on('pointerdown', (pointer) => {
            if (pointer.x < 400) {
                this.player.setVelocityX(-160);
            } else {
                this.player.setVelocityX(160);
            }
            
            if (pointer.y < 300 && this.player.body.touching.down) {
                this.player.setVelocityY(-330);
            }
        });
    }
    
    update() {
        // Player movement
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.player.setVelocityX(-160);
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.player.setVelocityX(160);
        } else {
            this.player.setVelocityX(0);
        }
        
        if ((this.cursors.up.isDown || this.wasd.W.isDown || this.cursors.space.isDown) && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: GameScene
};

// Start the game
const game = new Phaser.Game(config);`,
          type: "js",
          language: "javascript",
        },
      )
    }

    return files
  }
}
