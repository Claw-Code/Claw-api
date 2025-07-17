import type { LLMProvider } from "../../../types"

export class OllamaProvider implements LLMProvider {
  name = "Ollama"
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || "http://localhost:11434"
  }

  async generate(prompt: string, context?: any): Promise<string> {
    const model = context?.model || "codellama:7b"

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: this.formatPromptForGameDev(prompt),
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const result = await response.json()
    return result.response
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      return response.ok
    } catch {
      return false
    }
  }

  private formatPromptForGameDev(prompt: string): string {
    return `You are a game development expert specializing in 2D and 3D games using modern web technologies like Three.js, Canvas API, and WebGL.

Task: ${prompt}

Please generate:
1. Complete, production-ready code
2. Proper error handling
3. Performance optimizations for games
4. Clear documentation
5. Modern ES6+ syntax

Focus on:
- Game loops and rendering
- Input handling
- Physics and collision detection
- Asset management
- Performance optimization

Generate the code:`
  }
}
