import type { LLMProvider, CodeFile } from "../../types"
import { GroqProvider } from "./providers/groq"
import { HuggingFaceProvider } from "./providers/huggingface"
import { OllamaProvider } from "./providers/ollama"
import { CodeCompiler } from "../CodeCompiler"

export class LLMService {
  private providers: LLMProvider[]
  private primaryProvider: LLMProvider
  private codeCompiler: CodeCompiler
  private maxRetries = 3

  constructor() {
    // Prioritize Groq as it's free and reliable for Phaser.js
    this.primaryProvider = new GroqProvider()
    this.providers = [this.primaryProvider, new HuggingFaceProvider(), new OllamaProvider()]
    this.codeCompiler = new CodeCompiler()
  }

  /**
   * Generate code with self-correction loop and verification
   * Returns a properly structured JSON response
   */
  async generateCode(prompt: string, context?: any): Promise<string> {
    console.log(`🎮 Starting Phaser.js game generation with verification for: ${prompt.substring(0, 100)}...`)

    let attempt = 1
    let lastError = ""

    while (attempt <= this.maxRetries) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.maxRetries}`)

        // Generate code
        const response = await this.generateCodeInternal(prompt, context, lastError)

        // Ensure response is properly structured JSON
        let parsedResponse
        try {
          parsedResponse = JSON.parse(response)
        } catch (parseError) {
          console.error("Failed to parse LLM response as JSON:", parseError)
          // If response is not JSON, wrap it in our structure
          parsedResponse = this.wrapPlainTextResponse(response, "groq")
        }

        // Extract code files for verification
        const codeFiles = parsedResponse.codeResponse?.files || []

        if (codeFiles.length === 0) {
          console.log("⚠️  No code files generated, returning text response only")
          return JSON.stringify(parsedResponse)
        }

        // Verify the generated code
        const verificationResult = await this.verifyPhaserCode(
          codeFiles,
          parsedResponse.codeResponse?.framework || "phaser.js",
        )

        if (verificationResult.isValid) {
          console.log(`✅ Phaser.js code verification passed on attempt ${attempt}`)

          // Update the response with verification status and enhancements
          parsedResponse.codeResponse.status = "verified"
          parsedResponse.textResponse += "\n\n✅ **Code Verification**: All Phaser.js checks passed successfully!"
          parsedResponse.textResponse += "\n\n🎮 **Game Features**: " + this.extractGameFeatures(codeFiles)

          return JSON.stringify(parsedResponse)
        } else {
          console.log(`❌ Phaser.js code verification failed on attempt ${attempt}:`, verificationResult.errors)

          if (attempt === this.maxRetries) {
            // Last attempt failed, return with error info but still provide the code
            parsedResponse.codeResponse.status = "error"
            parsedResponse.textResponse += `\n\n⚠️ **Code Verification Issues**: ${verificationResult.errors.join(", ")}`
            parsedResponse.textResponse +=
              "\n\n💡 **Tip**: The code may still work, but consider these improvements for better performance."
            return JSON.stringify(parsedResponse)
          }

          // Prepare for retry with error feedback
          lastError = verificationResult.errors.join("; ")
          attempt++
        }
      } catch (error) {
        console.error(`❌ Generation attempt ${attempt} failed:`, error)

        if (attempt === this.maxRetries) {
          return this.createStructuredErrorResponse(error instanceof Error ? error.message : "Unknown error")
        }

        lastError = error instanceof Error ? error.message : "Generation failed"
        attempt++
      }
    }

    return this.createStructuredErrorResponse("Max retries exceeded")
  }

  /**
   * Internal code generation with optional error feedback for self-correction
   */
  private async generateCodeInternal(prompt: string, context?: any, previousError?: string): Promise<string> {
    let enhancedPrompt = prompt

    // Add error feedback for self-correction
    if (previousError) {
      enhancedPrompt = `The previous Phaser.js code generation had these issues: ${previousError}

Please fix these issues and generate corrected code for the original request: ${prompt}

**Critical fixes needed:**
1. Fix all JavaScript syntax errors
2. Use correct Phaser.js 3.x API calls and methods
3. Include proper scene management and lifecycle methods
4. Add comprehensive error handling and null checks
5. Ensure proper asset loading and management
6. Fix physics configuration and collision detection
7. Add proper input handling and event listeners
8. Include performance optimizations and memory management
9. Ensure mobile compatibility and responsive design
10. Add proper game state management

**Phaser.js Best Practices to Follow:**
- Use proper scene inheritance (extends Phaser.Scene)
- Implement preload(), create(), and update() methods correctly
- Use this.physics.add for physics bodies
- Use this.add for game objects
- Use this.input for input handling
- Use this.anims for animations
- Use this.sound for audio
- Use this.cameras for camera controls
- Proper cleanup in scene shutdown/destroy methods`
    }

    // Try primary provider (Groq) first
    try {
      const isAvailable = await this.primaryProvider.isAvailable()
      if (isAvailable) {
        console.log(`✅ Using primary provider: ${this.primaryProvider.name}`)
        const response = await this.primaryProvider.generate(enhancedPrompt, {
          ...context,
          framework: "phaser.js",
        })
        console.log(`✅ Generated Phaser.js response from ${this.primaryProvider.name}`)
        return response
      }
    } catch (error) {
      console.error(`❌ Primary provider ${this.primaryProvider.name} failed:`, error)
    }

    // Try fallback providers
    for (const provider of this.providers.slice(1)) {
      try {
        console.log(`🔄 Trying fallback provider: ${provider.name}`)
        const isAvailable = await provider.isAvailable()
        if (isAvailable) {
          const response = await provider.generate(enhancedPrompt, {
            ...context,
            framework: "phaser.js",
          })
          console.log(`✅ Generated Phaser.js response from ${provider.name}`)
          return response
        }
      } catch (error) {
        console.warn(`⚠️  Provider ${provider.name} failed:`, error)
        continue
      }
    }

    throw new Error("All LLM providers are unavailable")
  }

  /**
   * Wrap plain text response in proper structure
   */
  private wrapPlainTextResponse(response: string, provider: string) {
    return {
      thinking: "Processing the response and extracting code components...",
      textResponse: response,
      codeResponse: {
        files: this.extractCodeFiles(response),
        framework: "phaser.js",
        language: "javascript",
        status: "completed",
      },
    }
  }

  /**
   * Create a properly structured error response that the frontend can display correctly
   */
  private createStructuredErrorResponse(errorMessage: string): string {
    console.log(`🔧 Creating structured error response for: ${errorMessage}`)

    return JSON.stringify({
      thinking:
        "I encountered an error while generating the Phaser.js game. Let me provide a working example and guidance instead.",
      textResponse: `I apologize, but I encountered an issue while generating your game. Here's a comprehensive guide to help you get started with Phaser.js development:

## 🎮 Phaser.js Game Development Guide

### 1. **Basic Game Setup**
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

### 2. **Scene Structure**
- **preload()**: Load all game assets
- **create()**: Initialize game objects and setup
- **update()**: Game loop logic (60 FPS)

### 3. **Essential Features to Include**
- ✅ Player character with smooth movement
- ✅ Enemy AI and obstacle systems
- ✅ Collectibles and power-ups
- ✅ Particle effects and visual polish
- ✅ Sound effects and background music
- ✅ Score system and UI elements
- ✅ Mobile touch controls
- ✅ Multiple levels or endless gameplay

### 4. **Performance Tips**
- Use object pooling for bullets/enemies
- Optimize sprite atlases
- Implement proper cleanup
- Use efficient collision detection
- Minimize draw calls

Please try your request again with more specific details about the type of game you'd like to create!`,
      codeResponse: {
        files: [
          {
            path: "index.html",
            content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phaser.js Game Template</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Arial', sans-serif;
        }
        canvas {
            border: 3px solid #fff;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .loading {
            color: white;
            font-size: 24px;
            text-align: center;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div>
        <div id="game-container"></div>
        <div class="loading">Loading Phaser.js Game...</div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
    <script src="game.js"></script>
</body>
</html>`,
            type: "html",
            language: "html",
            size: 1024,
            description: "Main HTML file with Phaser.js CDN setup",
          },
          {
            path: "game.js",
            content: `// Phaser.js Game Template with Best Practices

class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }
    
    preload() {
        // Create loading bar
        const loadingBar = this.add.graphics();
        const loadingBox = this.add.graphics();
        
        loadingBox.fillStyle(0x222222);
        loadingBox.fillRect(240, 270, 320, 50);
        
        // Loading progress
        this.load.on('progress', (value) => {
            loadingBar.clear();
            loadingBar.fillStyle(0x00ff00);
            loadingBar.fillRect(250, 280, 300 * value, 30);
        });
        
        // Generate placeholder assets
        this.generateAssets();
        
        // Load complete
        this.load.on('complete', () => {
            this.scene.start('GameScene');
        });
    }
    
    generateAssets() {
        // Create colored rectangles as placeholder sprites
        this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
        
        console.log('Assets generated successfully!');
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.score = 0;
    }
    
    create() {
        // Create game world
        this.createWorld();
        this.createPlayer();
        this.createUI();
        this.setupInput();
        this.setupPhysics();
        
        // Add welcome message
        this.add.text(400, 100, 'Phaser.js Game Template', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.add.text(400, 140, 'Use arrow keys to move', {
            fontSize: '16px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }
    
    createWorld() {
        // Create game world background
        this.add.rectangle(400, 300, 800, 600, 0x2c3e50);
        
        // Add some visual elements
        for (let i = 0; i < 50; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(0, 600),
                Phaser.Math.Between(1, 3),
                0xffffff,
                0.8
            );
            
            // Add twinkling effect
            this.tweens.add({
                targets: star,
                alpha: 0.2,
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1
            });
        }
    }
    
    createPlayer() {
        // Create player sprite
        this.player = this.add.rectangle(400, 500, 40, 40, 0x00ff00);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setBounce(0.2);
        
        // Add player glow effect
        this.player.setStrokeStyle(2, 0x00ff00);
    }
    
    createUI() {
        // Score display
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // FPS display (for development)
        this.fpsText = this.add.text(16, 50, 'FPS: 60', {
            fontSize: '16px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        });
    }
    
    setupInput() {
        // Keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        
        // Mobile touch controls
        this.input.on('pointerdown', (pointer) => {
            const playerX = this.player.x;
            const playerY = this.player.y;
            
            if (pointer.x < playerX) {
                this.player.body.setVelocityX(-200);
            } else if (pointer.x > playerX) {
                this.player.body.setVelocityX(200);
            }
            
            if (pointer.y < playerY) {
                this.player.body.setVelocityY(-200);
            } else if (pointer.y > playerY) {
                this.player.body.setVelocityY(200);
            }
        });
    }
    
    setupPhysics() {
        // Enable physics for the player
        this.physics.world.setBounds(0, 0, 800, 600);
    }
    
    update() {
        // Update FPS display
        this.fpsText.setText('FPS: ' + Math.round(this.game.loop.actualFps));
        
        // Player movement
        this.handlePlayerMovement();
        
        // Update score
        this.score += 1;
        this.scoreText.setText('Score: ' + this.score);
    }
    
    handlePlayerMovement() {
        const speed = 200;
        
        // Reset velocity
        this.player.body.setVelocity(0);
        
        // Keyboard controls
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.player.body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.player.body.setVelocityX(speed);
        }
        
        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            this.player.body.setVelocityY(-speed);
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            this.player.body.setVelocityY(speed);
        }
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#2c3e50',
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [PreloadScene, GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 400,
            height: 300
        },
        max: {
            width: 1200,
            height: 900
        }
    }
};

// Initialize the game
const game = new Phaser.Game(config);

// Error handling
window.addEventListener('error', (e) => {
    console.error('Game Error:', e.error);
});`,
            type: "js",
            language: "javascript",
            size: 8420,
            description: "Complete Phaser.js game template with scenes and gameplay",
          },
        ],
        framework: "phaser.js",
        language: "javascript",
        gameFeatures: ["Basic Game Structure", "Scene Management", "Input Controls"],
        status: "error",
        instructions:
          "1. Download the files\n2. Open index.html in a browser\n3. Try your request again with more specific details",
      },
      error: errorMessage, // This will show in the red error box
      status: "error", // This will show the error badge
    })
  }

  /**
   * Verify generated Phaser.js code using multiple methods
   */
  private async verifyPhaserCode(
    codeFiles: CodeFile[],
    framework: string,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      // 1. Phaser.js specific syntax validation
      for (const file of codeFiles) {
        const phaserErrors = this.validatePhaserSyntax(file.content, file.type)
        errors.push(...phaserErrors)
      }

      // 2. Check for proper game structure
      const structureErrors = this.validateGameStructure(codeFiles)
      errors.push(...structureErrors)

      // 3. Performance and best practices check
      const performanceErrors = this.validatePerformance(codeFiles)
      errors.push(...performanceErrors)

      return {
        isValid: errors.length === 0,
        errors,
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [`Verification failed: ${error instanceof Error ? error.message : "Unknown error"}`],
      }
    }
  }

  /**
   * Validate Phaser.js specific syntax and patterns
   */
  private validatePhaserSyntax(code: string, fileType: string): string[] {
    const errors: string[] = []

    if (fileType === "js" || fileType === "javascript") {
      // Check for Phaser.js imports/CDN
      if (!code.includes("Phaser") && !code.includes("phaser")) {
        errors.push("Missing Phaser.js library reference")
      }

      // Check for proper scene structure
      if (code.includes("class") && code.includes("Scene")) {
        if (!code.includes("extends Phaser.Scene")) {
          errors.push("Scene class should extend Phaser.Scene")
        }

        if (!code.includes("constructor()") && !code.includes("constructor(")) {
          errors.push("Scene class missing constructor")
        }

        if (!code.includes("super(")) {
          errors.push("Scene constructor should call super()")
        }
      }

      // Check for proper game configuration
      if (code.includes("new Phaser.Game")) {
        if (!code.includes("type:") && !code.includes("width:") && !code.includes("height:")) {
          errors.push("Game configuration missing essential properties (type, width, height)")
        }
      }

      // Basic JavaScript syntax checks
      const openBrackets = (code.match(/\{/g) || []).length
      const closeBrackets = (code.match(/\}/g) || []).length
      if (openBrackets !== closeBrackets) {
        errors.push("Mismatched curly brackets")
      }

      const openParens = (code.match(/\(/g) || []).length
      const closeParens = (code.match(/\)/g) || []).length
      if (openParens !== closeParens) {
        errors.push("Mismatched parentheses")
      }

      // Check for common Phaser.js methods
      if (code.includes("preload()") && !code.includes("this.load")) {
        errors.push("preload() method should use this.load for asset loading")
      }

      if (code.includes("create()") && !code.includes("this.add") && !code.includes("this.physics")) {
        errors.push("create() method should use this.add or this.physics for game objects")
      }
    }

    if (fileType === "html") {
      // Check for proper HTML structure
      if (!code.includes("<!DOCTYPE html>")) {
        errors.push("HTML file missing DOCTYPE declaration")
      }

      if (!code.includes("phaser") && !code.includes("Phaser")) {
        errors.push("HTML file missing Phaser.js script reference")
      }

      if (!code.includes("<script") || !code.includes("</script>")) {
        errors.push("HTML file missing script tags")
      }
    }

    return errors
  }

  /**
   * Validate overall game structure and architecture
   */
  private validateGameStructure(codeFiles: CodeFile[]): string[] {
    const errors: string[] = []

    const hasHTML = codeFiles.some((file) => file.type === "html")
    const hasJS = codeFiles.some((file) => file.type === "js" || file.type === "javascript")

    if (!hasHTML) {
      errors.push("Missing HTML file for game deployment")
    }

    if (!hasJS) {
      errors.push("Missing JavaScript file with game logic")
    }

    // Check for essential game components
    const gameCode = codeFiles.find((file) => file.type === "js" || file.type === "javascript")?.content || ""

    if (gameCode) {
      if (!gameCode.includes("Scene") && !gameCode.includes("scene")) {
        errors.push("Game should have at least one scene")
      }

      if (!gameCode.includes("preload") && !gameCode.includes("load")) {
        errors.push("Game should have asset loading functionality")
      }

      if (!gameCode.includes("input") && !gameCode.includes("keyboard") && !gameCode.includes("pointer")) {
        errors.push("Game should have input handling for player interaction")
      }
    }

    return errors
  }

  /**
   * Validate performance and best practices
   */
  private validatePerformance(codeFiles: CodeFile[]): string[] {
    const errors: string[] = []

    const gameCode = codeFiles.find((file) => file.type === "js" || file.type === "javascript")?.content || ""

    if (gameCode) {
      // Check for potential performance issues
      if (gameCode.includes("setInterval") || gameCode.includes("setTimeout")) {
        errors.push("Consider using Phaser's built-in timer events instead of setInterval/setTimeout")
      }

      // Check for proper cleanup
      if (gameCode.includes("create()") && !gameCode.includes("destroy") && gameCode.length > 1000) {
        errors.push("Consider adding proper cleanup methods for complex games")
      }

      // Check for mobile optimization
      if (!gameCode.includes("scale") && !gameCode.includes("resize")) {
        errors.push("Consider adding responsive scaling for mobile devices")
      }
    }

    return errors
  }

  /**
   * Extract game features from code for documentation
   */
  private extractGameFeatures(codeFiles: CodeFile[]): string {
    const features: string[] = []
    const gameCode = codeFiles.find((file) => file.type === "js" || file.type === "javascript")?.content || ""

    if (gameCode.includes("physics")) features.push("Physics System")
    if (gameCode.includes("animation") || gameCode.includes("anims")) features.push("Animations")
    if (gameCode.includes("particle")) features.push("Particle Effects")
    if (gameCode.includes("sound") || gameCode.includes("audio")) features.push("Audio System")
    if (gameCode.includes("input") || gameCode.includes("keyboard")) features.push("Input Controls")
    if (gameCode.includes("collision") || gameCode.includes("overlap")) features.push("Collision Detection")
    if (gameCode.includes("tween")) features.push("Smooth Animations")
    if (gameCode.includes("camera")) features.push("Camera Controls")
    if (gameCode.includes("mobile") || gameCode.includes("touch")) features.push("Mobile Support")

    return features.length > 0 ? features.join(", ") : "Basic Game Structure"
  }

  /**
   * Extract code files from plain text response
   */
  private extractCodeFiles(content: string): CodeFile[] {
    const codeBlocks = content.match(/```[\w]*\n([\s\S]*?)\n```/g) || []
    const files: CodeFile[] = []

    codeBlocks.forEach((block, index) => {
      const langMatch = block.match(/```(\w+)/)
      const language = langMatch ? langMatch[1] : "javascript"
      const code = block.replace(/```[\w]*\n/, "").replace(/\n```$/, "")

      // Determine file type and extension
      let extension = "js"
      let type = "js" as any
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

    // If no code blocks found, return empty array
    return files
  }

  /**
   * Legacy method for backward compatibility
   */
  async validateCode(code: string): Promise<{ isValid: boolean; errors: string[] }> {
    const mockFile: CodeFile = {
      path: "game.js",
      content: code,
      type: "js",
      language: "javascript",
    }

    return this.verifyPhaserCode([mockFile], "phaser.js")
  }

  /**
   * Get status of all providers
   */
  async getProvidersStatus(): Promise<{ name: string; available: boolean }[]> {
    const status = []

    for (const provider of this.providers) {
      try {
        const available = await provider.isAvailable()
        status.push({ name: provider.name, available })
      } catch {
        status.push({ name: provider.name, available: false })
      }
    }

    return status
  }
}
