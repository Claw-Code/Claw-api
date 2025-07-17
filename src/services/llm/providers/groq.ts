import type { LLMProvider } from "../../../types"

export class GroqProvider implements LLMProvider {
  name = "Groq"
  private apiKey: string
  private baseUrl = "https://api.groq.com/openai/v1"

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || ""
  }

  async generate(prompt: string, context?: any): Promise<string> {
    const model = context?.model || "mixtral-8x7b-32768"

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
            content:
              "You are an expert game developer and coding assistant specializing in 2D and 3D game development with modern web technologies.",
          },
          {
            role: "user",
            content: this.formatPromptForGameDev(prompt),
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`)
    }

    const result = await response.json()
    return result.choices[0]?.message?.content || ""
  }

  async isAvailable(): Promise<boolean> {
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
  }
}
