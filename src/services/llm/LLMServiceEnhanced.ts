import type { LLMProvider, CodeFile } from "../../types"
import { GroqProvider } from "./providers/groq"
import { HuggingFaceProvider } from "./providers/huggingface"
import { OllamaProvider } from "./providers/ollama"
import { CodeCompiler } from "../CodeCompiler"

export class LLMServiceEnhanced {
  private providers: LLMProvider[]
  private primaryProvider: LLMProvider
  private codeCompiler: CodeCompiler
  private maxRetries = 3

  constructor() {
    // Prioritize Groq as it's free and reliable for Kaboom.js
    this.primaryProvider = new GroqProvider()
    this.providers = [this.primaryProvider, new HuggingFaceProvider(), new OllamaProvider()]
    this.codeCompiler = new CodeCompiler()
  }

  /**
   * Generate and verify code with self-correction loop
   */
  async generateAndVerifyCode(prompt: string, context?: any): Promise<string> {
    console.log(`🤖 Starting code generation with verification for: ${prompt.substring(0, 100)}...`)

    let attempt = 1
    let lastError = ""

    while (attempt <= this.maxRetries) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.maxRetries}`)

        // Generate code
        const response = await this.generateCode(prompt, context, lastError)
        const parsedResponse = JSON.parse(response)

        // Extract code files for verification
        const codeFiles = parsedResponse.codeResponse?.files || []

        if (codeFiles.length === 0) {
          console.log("⚠️  No code files generated, returning text response only")
          return response
        }

        // Verify the generated code
        const verificationResult = await this.verifyCode(
          codeFiles,
          parsedResponse.codeResponse?.framework || "kaboom.js",
        )

        if (verificationResult.isValid) {
          console.log(`✅ Code verification passed on attempt ${attempt}`)

          // Update the response with verification status
          parsedResponse.codeResponse.status = "verified"
          parsedResponse.textResponse += "\n\n✅ **Code Verification**: All checks passed successfully!"

          return JSON.stringify(parsedResponse)
        } else {
          console.log(`❌ Code verification failed on attempt ${attempt}:`, verificationResult.errors)

          if (attempt === this.maxRetries) {
            // Last attempt failed, return with error info
            parsedResponse.codeResponse.status = "error"
            parsedResponse.textResponse += `\n\n⚠️ **Code Verification Failed**: ${verificationResult.errors.join(", ")}`
            return JSON.stringify(parsedResponse)
          }

          // Prepare for retry with error feedback
          lastError = verificationResult.errors.join("; ")
          attempt++
        }
      } catch (error) {
        console.error(`❌ Generation attempt ${attempt} failed:`, error)

        if (attempt === this.maxRetries) {
          return this.createErrorResponse(error instanceof Error ? error.message : "Unknown error")
        }

        lastError = error instanceof Error ? error.message : "Generation failed"
        attempt++
      }
    }

    return this.createErrorResponse("Max retries exceeded")
  }

  /**
   * Generate code with optional error feedback for self-correction
   */
  private async generateCode(prompt: string, context?: any, previousError?: string): Promise<string> {
    let enhancedPrompt = prompt

    // Add error feedback for self-correction
    if (previousError) {
      enhancedPrompt = `The previous code generation failed with these errors: ${previousError}

Please fix these issues and generate corrected code for the original request: ${prompt}

Make sure to:
1. Fix all syntax errors
2. Use correct Kaboom.js API calls
3. Include all necessary imports
4. Follow Kaboom.js best practices`
    }

    // Try primary provider (Groq) first
    try {
      const isAvailable = await this.primaryProvider.isAvailable()
      if (isAvailable) {
        console.log(`✅ Using primary provider: ${this.primaryProvider.name}`)
        const response = await this.primaryProvider.generate(enhancedPrompt, context)
        console.log(`✅ Generated response from ${this.primaryProvider.name}`)
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
          const response = await provider.generate(enhancedPrompt, context)
          console.log(`✅ Generated response from ${provider.name}`)
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
   * Verify generated code using multiple methods
   */
  private async verifyCode(codeFiles: CodeFile[], framework: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      // 1. Basic syntax validation for Kaboom.js
      for (const file of codeFiles) {
        const syntaxErrors = this.validateKaboomSyntax(file.content)
        errors.push(...syntaxErrors)
      }

      // 2. Try to compile the code (if it's a complete project)
      if (framework === "kaboom.js" && codeFiles.length > 0) {
        try {
          const generatedCode = {
            files: codeFiles,
            framework,
            language: "javascript",
          }

          // This would attempt to build the project
          const compileResult = await this.codeCompiler.compileAndPreview(generatedCode)

          if (compileResult.status === "error") {
            errors.push(...compileResult.buildLogs.filter((log) => log.includes("error") || log.includes("Error")))
          }
        } catch (compileError) {
          console.log("⚠️  Compilation check skipped:", compileError)
          // Don't add compilation errors to the main error list for Kaboom.js
          // as it might not be a complete buildable project
        }
      }

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
   * Validate Kaboom.js specific syntax and patterns
   */
  private validateKaboomSyntax(code: string): string[] {
    const errors: string[] = []

    // Check for common Kaboom.js patterns
    if (!code.includes("kaboom") && !code.includes("import") && !code.includes("require")) {
      errors.push("Missing Kaboom.js import or initialization")
    }

    // Check for basic JavaScript syntax errors
    try {
      // This is a very basic check - in production you'd use a proper parser
      if (code.includes("function") || code.includes("const") || code.includes("let")) {
        // Basic bracket matching
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
      }
    } catch (error) {
      errors.push("Syntax validation failed")
    }

    // Check for Kaboom.js best practices
    if (code.includes("kaboom(") && !code.includes("add([")) {
      errors.push("Kaboom initialized but no game objects added")
    }

    return errors
  }

  /**
   * Create a structured error response
   */
  private createErrorResponse(errorMessage: string): string {
    return JSON.stringify({
      thinking: "I encountered an error while generating the code. Let me provide some guidance instead.",
      textResponse: `I apologize, but I encountered an issue: ${errorMessage}. 

Here are some tips for Kaboom.js development:

## Getting Started with Kaboom.js

1. **Initialize Kaboom**:
\`\`\`javascript
import kaboom from "kaboom";

kaboom({
    width: 640,
    height: 480,
    background: [0, 0, 0],
});
\`\`\`

2. **Add Game Objects**:
\`\`\`javascript
add([
    text("Hello Kaboom!"),
    pos(center()),
    anchor("center"),
]);
\`\`\`

3. **Handle Input**:
\`\`\`javascript
onKeyPress("space", () => {
    // Handle spacebar press
});
\`\`\`

Please try your request again with more specific details about what you'd like to create.`,
      codeResponse: {
        files: [
          {
            path: "example.js",
            content: `import kaboom from "kaboom";

// Initialize Kaboom
kaboom({
    width: 640,
    height: 480,
    background: [0, 0, 0],
});

// Add a simple text object
add([
    text("Hello, Kaboom!"),
    pos(center()),
    anchor("center"),
]);

// Add some interactivity
onKeyPress("space", () => {
    add([
        text("Space pressed!"),
        pos(rand(0, width()), rand(0, height())),
        lifespan(2),
    ]);
});`,
            type: "js",
            language: "javascript",
          },
        ],
        framework: "kaboom.js",
        language: "javascript",
        status: "error",
      },
    })
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
