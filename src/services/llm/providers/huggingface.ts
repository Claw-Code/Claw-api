import type { LLMProvider } from "../../../types"

export class HuggingFaceProvider implements LLMProvider {
  name = "HuggingFace"
  private apiKey: string
  private baseUrl = "https://api-inference.huggingface.co/models"

  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || ""
  }

  async generate(prompt: string, context?: any): Promise<string> {
    const model = context?.model || "microsoft/DialoGPT-medium"

    const response = await fetch(`${this.baseUrl}/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: this.formatPromptForCoding(prompt),
        parameters: {
          max_length: 2000,
          temperature: 0.7,
          do_sample: true,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.statusText}`)
    }

    const result = await response.json()
    return this.extractCode(result[0]?.generated_text || "")
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/microsoft/DialoGPT-medium`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: "test" }),
      })
      return response.ok
    } catch {
      return false
    }
  }

  private formatPromptForCoding(prompt: string): string {
    return `You are an expert game developer specializing in 2D and 3D games. Generate clean, well-structured code for: ${prompt}

Please provide:
1. Complete, runnable code
2. Proper imports and dependencies
3. Comments explaining key functionality
4. Modern JavaScript/TypeScript patterns
5. Game development best practices

Code:`
  }

  private extractCode(response: string): string {
    // Extract code blocks from the response
    const codeBlockRegex = /```[\s\S]*?```/g
    const codeBlocks = response.match(codeBlockRegex)

    if (codeBlocks && codeBlocks.length > 0) {
      return codeBlocks.map((block) => block.replace(/```[\w]*\n?/, "").replace(/```$/, "")).join("\n\n")
    }

    return response
  }
}
