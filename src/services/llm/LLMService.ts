import type { LLMProvider } from "../../types"
import { HuggingFaceProvider } from "./providers/huggingface"
import { OllamaProvider } from "./providers/ollama"
import { GroqProvider } from "./providers/groq"

export class LLMService {
  private providers: LLMProvider[]
  private fallbackProvider: LLMProvider

  constructor() {
    this.providers = [new GroqProvider(), new HuggingFaceProvider(), new OllamaProvider()]
    this.fallbackProvider = new HuggingFaceProvider()
  }

  async generateCode(prompt: string, context?: any): Promise<string> {
    // Try each provider in order
    for (const provider of this.providers) {
      try {
        const isAvailable = await provider.isAvailable()
        if (isAvailable) {
          console.log(`Using provider: ${provider.name}`)
          return await provider.generate(prompt, context)
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error)
        continue
      }
    }

    // Use fallback provider
    try {
      console.log(`Using fallback provider: ${this.fallbackProvider.name}`)
      return await this.fallbackProvider.generate(prompt, context)
    } catch (error) {
      throw new Error(`All LLM providers failed. Last error: ${error}`)
    }
  }

  async validateCode(code: string): Promise<{ isValid: boolean; errors: string[] }> {
    const validationPrompt = `Please validate this code and check for syntax errors, security issues, and best practices:

${code}

Return a JSON response with:
{
  "isValid": boolean,
  "errors": ["error1", "error2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`

    try {
      const response = await this.generateCode(validationPrompt)
      const validation = JSON.parse(response)
      return {
        isValid: validation.isValid || false,
        errors: validation.errors || [],
      }
    } catch (error) {
      return {
        isValid: false,
        errors: ["Code validation failed"],
      }
    }
  }
}
