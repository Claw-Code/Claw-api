import type { LLMProvider } from "../../../types"

export class GroqProvider implements LLMProvider {
  name = "Groq"
  private apiKey: string
  private baseUrl = "https://api.groq.com/openai/v1"

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || ""
  }

  async generate(prompt: string, context?: any): Promise<string> {
<<<<<<< HEAD
    if (!this.apiKey) {
      throw new Error("GROQ_API_KEY is not configured")
    }

    // Use Llama model for free tier
    const model = context?.model || "llama3-8b-8192"
=======
    const model = context?.model || "mixtral-8x7b-32768"
>>>>>>> d07d2a6 (Init API)

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
<<<<<<< HEAD
            content: this.getPhaserSystemPrompt(),
          },
          {
            role: "user",
            content: this.formatPromptForPhaser(prompt, context),
=======
            content:
              "You are an expert game developer and coding assistant specializing in 2D and 3D game development with modern web technologies.",
          },
          {
            role: "user",
            content: this.formatPromptForGameDev(prompt),
>>>>>>> d07d2a6 (Init API)
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
<<<<<<< HEAD
        stream: false,
=======
>>>>>>> d07d2a6 (Init API)
      }),
    })

    if (!response.ok) {
<<<<<<< HEAD
      const errorText = await response.text()
      throw new Error(`Groq API error (${response.status}): ${errorText}`)
    }

    const result = await response.json()
    const content = result.choices[0]?.message?.content || ""

    return this.parseStructuredResponse(content)
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false

=======
      throw new Error(`Groq API error: ${response.statusText}`)
    }

    const result = await response.json()
    return result.choices[0]?.message?.content || ""
  }

  async isAvailable(): Promise<boolean> {
>>>>>>> d07d2a6 (Init API)
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }

<<<<<<< HEAD
  private getPhaserSystemPrompt(): string {
    return `You are Claw AI, a world-class expert game developer specializing exclusively in creating 2D games with Phaser.js.

Your expertise includes:
- **Phaser.js 3.x** - The latest version with modern ES6+ syntax
- **Game Architecture** - Proper scene management, game states, and object-oriented design
- **Asset Management** - Efficient loading, caching, and optimization of sprites, sounds, and animations
- **Physics Systems** - Arcade Physics, Matter.js integration, collision detection
- **Performance** - Optimized rendering, object pooling, memory management
- **Cool Visual Effects** - Particles, tweens, shaders, lighting effects
- **Audio Integration** - Sound effects, background music, spatial audio
- **Input Handling** - Keyboard, mouse, touch, gamepad support
- **Mobile Optimization** - Responsive design, touch controls, performance tuning

## Core Principles:
- You ONLY use Phaser.js 3.x functions and patterns
- You NEVER suggest other libraries like Kaboom, React, or Three.js
- You always provide complete, runnable, production-ready code
- You follow Phaser.js best practices and modern JavaScript patterns
- You create engaging games with proper game mechanics and cool assets
- You include comprehensive error handling and performance optimizations

## Phaser.js Best Practices:

**1. Game Configuration:**
\`\`\`javascript
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#2c3e50',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [PreloadScene, GameScene]
};
\`\`\`

**2. Scene Structure:**
\`\`\`javascript
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    preload() {
        // Load assets
    }
    
    create() {
        // Initialize game objects
    }
    
    update() {
        // Game loop logic
    }
}
\`\`\`

**3. Asset Loading:**
\`\`\`javascript
preload() {
    this.load.image('player', 'assets/player.png');
    this.load.spritesheet('explosion', 'assets/explosion.png', {
        frameWidth: 64,
        frameHeight: 64
    });
    this.load.audio('jump', 'assets/jump.wav');
}
\`\`\`

**4. Sprite Creation with Physics:**
\`\`\`javascript
this.player = this.physics.add.sprite(100, 450, 'player');
this.player.setBounce(0.2);
this.player.setCollideWorldBounds(true);
\`\`\`

**5. Animation System:**
\`\`\`javascript
this.anims.create({
    key: 'run',
    frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
});
\`\`\`

**6. Input Handling:**
\`\`\`javascript
this.cursors = this.input.keyboard.createCursorKeys();
this.wasd = this.input.keyboard.addKeys('W,S,A,D');
\`\`\`

**7. Collision Detection:**
\`\`\`javascript
this.physics.add.collider(player, platforms);
this.physics.add.overlap(player, stars, collectStar, null, this);
\`\`\`

**8. Particle Effects:**
\`\`\`javascript
const particles = this.add.particles(x, y, 'spark', {
    speed: { min: 100, max: 200 },
    scale: { start: 0.5, end: 0 },
    blendMode: 'ADD'
});
\`\`\`

## Asset Generation Guidelines:
- Create placeholder assets using colored rectangles and basic shapes
- Use Phaser's built-in graphics API for procedural generation
- Include particle effects for visual appeal
- Add sound effect placeholders with proper audio management
- Use tweens for smooth animations and transitions
- Implement proper sprite atlases for performance

IMPORTANT: Always respond in this exact JSON format:
{
  "thinking": "Your detailed thought process for the Phaser.js game design, architecture, and implementation strategy.",
  "textResponse": "Your comprehensive explanation of the game mechanics, controls, features, and how to play. Include technical details about the Phaser.js implementation.",
  "codeResponse": {
    "files": [
      {
        "path": "index.html",
        "content": "// Complete HTML file with Phaser.js CDN",
        "type": "html",
        "language": "html"
      },
      {
        "path": "game.js",
        "content": "// Complete Phaser.js game code",
        "type": "js",
        "language": "javascript"
      },
      {
        "path": "assets.js",
        "content": "// Asset generation and management code",
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

## Game Elements to Include:
- **Player Character**: Animated sprite with smooth movement
- **Enemies/Obstacles**: AI-driven or physics-based challenges
- **Collectibles**: Power-ups, coins, or score items
- **Visual Effects**: Particles, explosions, screen shake
- **Audio System**: Sound effects and background music
- **UI Elements**: Score display, health bars, menus
- **Level Design**: Multiple levels or procedural generation
- **Game States**: Menu, gameplay, game over, pause
- **Mobile Support**: Touch controls and responsive design

## Technical Requirements:
- Proper scene management and transitions
- Object pooling for performance optimization
- Asset preloading with progress indicators
- Error handling for missing assets or failed operations
- Memory management and cleanup
- Scalable architecture for easy expansion
- Cross-browser compatibility
- Mobile-first responsive design`

    const attachments = context?.attachments || []

    if (attachments.length > 0) {
      formattedPrompt += `\n\n## Context from uploaded files:\n`
      attachments.forEach((attachment: any, index: number) => {
        formattedPrompt += `\n**File ${index + 1} (${attachment.filename}):**\n${attachment.content}\n`
      })
    }

    formattedPrompt += `\n\n## Deliverables:
Please provide:
1. **Complete HTML file** with Phaser.js CDN and proper structure
2. **Main game JavaScript file** with all game logic and scenes
3. **Asset generation file** with procedural asset creation
4. **Comprehensive documentation** explaining the game mechanics and code structure

The game should be immediately playable in a browser and demonstrate professional game development practices.`

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
        filename = index === 0 ? "index" : `page-${index + 1}`
      } else if (language === "css" || code.includes("body {") || code.includes("@media")) {
        extension = "css"
        type = "css"
        filename = "styles"
      } else if (code.includes("class") && code.includes("extends Phaser.Scene")) {
        filename = "game"
      } else if (code.includes("assets") || code.includes("preload")) {
        filename = "assets"
      }

      files.push({
        path: `${filename}.${extension}`,
        content: code,
        type,
        language: language === "javascript" || language === "js" ? "javascript" : language,
      })
    })

    // If no code blocks found, create default Phaser.js files
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
    <script src="game.js"></script>
</body>
</html>`,
          type: "html",
          language: "html",
        },
        {
          path: "game.js",
          content: `// Phaser.js game will be generated here
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    preload() {
        // Create placeholder assets
        this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }
    
    create() {
        this.add.text(400, 300, 'Phaser Game Loading...', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#2c3e50',
    scene: GameScene
};

const game = new Phaser.Game(config);`,
          type: "js",
          language: "javascript",
        },
      )
    }

    return files
=======
  private formatPromptForGameDev(prompt: string): string {
    return `Generate game development code for: ${prompt}

Requirements:
- Use modern JavaScript/TypeScript
- Focus on 2D/3D game development
- Include proper game architecture patterns
- Add performance optimizations
- Use libraries like Three.js, Phaser, or Canvas API as appropriate
- Include proper error handling and comments
- Make code production-ready

Please provide complete, runnable code with all necessary imports and setup.`
>>>>>>> d07d2a6 (Init API)
  }
}
