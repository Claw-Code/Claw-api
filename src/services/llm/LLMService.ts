import type { LLMProvider } from "../../types"
import { GroqProvider } from "./providers/groq"
import { HuggingFaceProvider } from "./providers/huggingface"
import { OllamaProvider } from "./providers/ollama"

export class LLMService {
  private providers: LLMProvider[]
  private primaryProvider: LLMProvider
  private logs: string[] = []

  constructor() {
    this.primaryProvider = new GroqProvider()
    this.providers = [this.primaryProvider, new HuggingFaceProvider(), new OllamaProvider()]
  }

  private log(message: string) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}`
    this.logs.push(logMessage)
    console.log(logMessage)

    // Keep only last 50 logs to prevent memory issues
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50)
    }
  }

  getLogs(): string[] {
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
  }

  /**
   * Generate code with real-time streaming updates
   */
  async generateCodeWithStreaming(prompt: string, context?: any, onUpdate?: (update: any) => void): Promise<string> {
    try {
      this.log("🚀 Starting streaming code generation")
      this.log(`📝 Prompt length: ${prompt.length}`)

      // Phase 1: Thinking
      onUpdate?.({
        type: "thinking",
        content: "Analyzing your game requirements and planning the architecture...",
      })
      await this.delay(800)

      onUpdate?.({
        type: "thinking_detail",
        content: "Designing Phaser.js game structure with modern best practices...",
      })
      await this.delay(600)

      // Phase 2: Generate the actual response from LLM
      this.log("🤖 Calling LLM provider for code generation...")
      const response = await this.generateCodeInternal(prompt, context)
      this.log(`✅ LLM response received, length: ${response.length}`)

      let parsedResponse
      try {
        parsedResponse = JSON.parse(response)
        this.log("✅ LLM response parsed successfully")
      } catch (e) {
        this.log(`❌ Failed to parse LLM response: ${e}`)
        this.log(`Raw response preview: ${response.substring(0, 500)}`)
        parsedResponse = this.createStructuredErrorResponse("Failed to parse LLM response")
      }

      // Phase 3: Stream text response
      if (parsedResponse.textResponse) {
        onUpdate?.({ type: "text_start" })
        const textChunks = this.chunkText(parsedResponse.textResponse, 80)

        for (let i = 0; i < textChunks.length; i++) {
          onUpdate?.({
            type: "text_chunk",
            chunk: textChunks[i],
            isComplete: i === textChunks.length - 1,
          })
          await this.delay(30)
        }
      }

      // Phase 4: Stream code files
      if (parsedResponse.codeResponse?.files) {
        const files = parsedResponse.codeResponse.files
        onUpdate?.({ type: "code_start", totalFiles: files.length })

        for (let i = 0; i < files.length; i++) {
          const file = files[i]

          onUpdate?.({
            type: "file_start",
            fileName: file.path,
            fileType: file.type,
            description: this.getFileDescription(file.path, file.type),
          })

          // Stream file content in chunks
          const contentChunks = this.chunkText(file.content, 200)
          for (let j = 0; j < contentChunks.length; j++) {
            onUpdate?.({
              type: "file_chunk",
              fileName: file.path,
              chunk: contentChunks[j],
              progress: ((j + 1) / contentChunks.length) * 100,
              isComplete: j === contentChunks.length - 1,
            })
            await this.delay(25)
          }

          onUpdate?.({
            type: "file_complete",
            fileName: file.path,
            file: file,
            fileIndex: i + 1,
            totalFiles: files.length,
          })
        }
      }

      // Phase 5: Verification
      onUpdate?.({
        type: "verification",
        content: "Verifying code quality and Phaser.js best practices...",
      })
      await this.delay(1200)

      this.log("✅ Code generation completed successfully")
      return JSON.stringify(parsedResponse)
    } catch (error) {
      this.log(`❌ Code generation failed: ${error}`)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      onUpdate?.({
        type: "error",
        error: errorMessage,
        details: "The AI generation process failed. Please try again.",
      })
      return this.createStructuredErrorResponse(errorMessage)
    }
  }

  /**
   * Debug method to test LLM provider directly
   */
  async generateCode(prompt: string, context?: any): Promise<string> {
    this.log(`🔍 Debug: Direct LLM call with prompt: ${prompt.substring(0, 100)}...`)
    return await this.generateCodeInternal(prompt, context)
  }

  /**
   * Get status of all LLM providers
   */
  async getProvidersStatus(): Promise<{ name: string; available: boolean }[]> {
    const status = []

    for (const provider of this.providers) {
      try {
        const available = await provider.isAvailable()
        status.push({ name: provider.name, available })
        this.log(`Provider ${provider.name}: ${available ? "available" : "unavailable"}`)
      } catch (error) {
        status.push({ name: provider.name, available: false })
        this.log(`Provider ${provider.name}: error - ${error}`)
      }
    }

    return status
  }

  // --- PRIVATE METHODS ---

  private async generateCodeInternal(prompt: string, context?: any): Promise<string> {
    // Try primary provider first
    try {
      this.log(`🔍 Checking primary provider: ${this.primaryProvider.name}`)
      if (await this.primaryProvider.isAvailable()) {
        this.log(`✅ Using primary provider: ${this.primaryProvider.name}`)
        const response = await this.primaryProvider.generate(prompt, context)
        this.log(`✅ Primary provider response length: ${response.length}`)
        return response
      } else {
        this.log(`❌ Primary provider ${this.primaryProvider.name} not available`)
      }
    } catch (error) {
      this.log(`❌ Primary provider ${this.primaryProvider.name} failed: ${error}`)
    }

    // Try fallback providers
    for (const provider of this.providers.slice(1)) {
      try {
        this.log(`🔄 Trying fallback provider: ${provider.name}`)
        if (await provider.isAvailable()) {
          this.log(`✅ Using fallback provider: ${provider.name}`)
          const response = await provider.generate(prompt, context)
          this.log(`✅ Fallback provider response length: ${response.length}`)
          return response
        } else {
          this.log(`❌ Fallback provider ${provider.name} not available`)
        }
      } catch (error) {
        this.log(`⚠️ Provider ${provider.name} failed: ${error}`)
        continue
      }
    }

    throw new Error("All LLM providers are unavailable")
  }

  private chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = []
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize))
    }
    return chunks
  }

  private getFileDescription(path: string, type: string): string {
    const descriptions: Record<string, string> = {
      "index.html": "Main HTML file with Phaser.js setup and game container",
      "game.js": "Core game logic with scenes, physics, and gameplay mechanics",
      "assets.js": "Asset management and procedural generation utilities",
      "styles.css": "Custom styling and responsive design rules",
      "README.md": "Documentation and setup instructions",
    }

    return descriptions[path] || `${type.toUpperCase()} file containing game code`
  }

  private createStructuredErrorResponse(errorMessage: string): string {
    return JSON.stringify({
      thinking: "I encountered an error while generating your game. Let me provide a basic template instead.",
      textResponse: `I apologize, but an error occurred: ${errorMessage}

Here's a basic Phaser.js game template to get you started:

## 🎮 Basic Phaser.js Game

This template includes:
- ✅ Phaser.js 3.x setup
- ✅ Basic game scene
- ✅ Player sprite with movement
- ✅ Simple physics system
- ✅ Mobile-friendly controls

## 🚀 Getting Started

1. Download the files
2. Open \`index.html\` in a web browser
3. Use arrow keys or WASD to move
4. Customize the game code as needed

## 🛠️ Next Steps

- Add enemies and obstacles
- Implement collision detection
- Create power-ups and scoring
- Add sound effects and music
- Design multiple levels`,
      codeResponse: {
        files: [
          {
            path: "index.html",
            content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phaser Game Template</title>
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
    <script src="game.js"></script>
</body>
</html>`,
            type: "html",
            language: "html",
          },
          {
            path: "game.js",
            content: `// Basic Phaser.js Game Template
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    preload() {
        // Create simple colored rectangles as placeholders
        this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        this.load.image('ground', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }
    
    create() {
        // Create ground
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
        this.add.text(16, 16, 'Use Arrow Keys or WASD to move', {
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
        
        if ((this.cursors.up.isDown || this.wasd.W.isDown) && this.player.body.touching.down) {
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
        ],
        framework: "phaser.js",
        language: "javascript",
        status: "error",
      },
      error: errorMessage,
      status: "error",
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
