import type { GameFile } from "../types"

export class ExternalGameAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.EXTERNAL_GAME_API_URL || "http://localhost:3005"
  }

  async generateGame(prompt: string, subdomain: string, onUpdate?: (event: any) => void): Promise<GameFile[]> {
    console.log(`🎮 Starting external game generation for: ${prompt.substring(0, 100)}...`)
    console.log(`🌐 External API URL: ${this.baseUrl}/api/generate/simple`)
    console.log(`🏷️ Subdomain (conversationId): ${subdomain}`)

    try {
      const requestBody = { prompt, subdomain }
      console.log(`📤 Sending request:`, requestBody)

      const response = await fetch(`${this.baseUrl}/api/generate/simple2`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log(`📥 Response status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ External API error response:`, errorText)
        throw new Error(`External API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      if (!response.body) {
        throw new Error("No response body received from external API")
      }

      const files: GameFile[] = []
      let liveUrl: string | null = null
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      console.log(`📡 Starting to read SSE stream...`)

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log(`🔚 Stream reading completed`)
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.trim() === "") continue

            try {
              // Parse SSE format: "data: jsonData"
              if (line.startsWith("data: ")) {
                const jsonData = line.substring(6) // Remove "data: " prefix
                const eventData = JSON.parse(jsonData)

                console.log(`📨 Received event:`, eventData.type || "file_event", eventData)

                // Handle different event types from external API
                if (eventData.step !== undefined) {
                  // Progress event
                  console.log(`📊 Progress: ${eventData.stepName} (${eventData.progress}%)`)

                  onUpdate?.({
                    type: "progress",
                    step: eventData.step,
                    totalSteps: eventData.totalSteps,
                    stepName: eventData.stepName,
                    progress: eventData.progress,
                    message: eventData.message,
                  })
                } else if (eventData.fileName && eventData.content) {
                  // Individual file event (fileName with capital N)
                  console.log(`📄 File generated: ${eventData.fileName} (${eventData.content.length} chars)`)

                  const gameFile: GameFile = {
                    path: eventData.fileName,
                    content: eventData.content,
                    type: this.getFileType(eventData.fileName),
                    language: this.getLanguage(eventData.fileName),
                  }

                  files.push(gameFile)

                  onUpdate?.({
                    type: "file_generated",
                    file: gameFile,
                    fileName: eventData.fileName,
                    fileType: eventData.fileType,
                    index: eventData.index,
                    totalFiles: eventData.totalFiles,
                  })
                } else if (eventData.filename && eventData.content) {
                  // Individual file event (filename with lowercase n - fallback)
                  console.log(`📄 File generated: ${eventData.filename} (${eventData.content.length} chars)`)

                  const gameFile: GameFile = {
                    path: eventData.filename,
                    content: eventData.content,
                    type: this.getFileType(eventData.filename),
                    language: this.getLanguage(eventData.filename),
                  }

                  files.push(gameFile)

                  onUpdate?.({
                    type: "file_generated",
                    file: gameFile,
                  })
                } else if (eventData.files) {
                  // Complete event with files array
                  console.log(`✅ Generation complete: ${eventData.files.length} files`)

                  // Add any remaining files
                  for (const file of eventData.files) {
                    if (!files.find((f) => f.path === file.path)) {
                      const gameFile: GameFile = {
                        path: file.path,
                        content: file.content,
                        type: this.getFileType(file.path),
                        language: this.getLanguage(file.path),
                      }
                      files.push(gameFile)
                    }
                  }

                  onUpdate?.({
                    type: "complete",
                    files: files,
                    metadata: eventData.metadata,
                  })
                } else if (eventData.chatId && eventData.projectId && eventData.setupInstructions) {
                  // Final completion event from external API - EXTRACT LIVE URL HERE
                  console.log(
                    `🎯 Final completion event: ${eventData.totalFiles} files, project: ${eventData.projectId}`,
                  )

                  // Extract the live URL from setupInstructions
                  liveUrl = eventData.setupInstructions.liveUrl || eventData.setupInstructions.url || null
                  console.log(`🌐 Extracted live URL: ${liveUrl}`)

                  onUpdate?.({
                    type: "complete",
                    files: files,
                    liveUrl: liveUrl, // Pass the live URL to the update handler
                    metadata: {
                      gameType: "HTML5 Canvas Game",
                      framework: "Vanilla JavaScript",
                      totalFiles: eventData.totalFiles,
                      projectId: eventData.projectId,
                      chainUsed: eventData.chainUsed,
                      chainSteps: eventData.chainSteps,
                    },
                    setupInstructions: eventData.setupInstructions,
                    validation: eventData.validation,
                  })
                } else if (eventData.error) {
                  // Error event
                  console.error(`❌ External API error:`, eventData)
                  onUpdate?.({
                    type: "error",
                    error: eventData.error,
                    details: eventData.details,
                  })
                  throw new Error(eventData.error)
                } else {
                  // Unknown event type - log for debugging
                  console.log(`🔍 Unknown event type:`, eventData)
                }
              }
            } catch (parseError) {
              console.warn(`⚠️ Failed to parse SSE line: ${line}`, parseError)
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      console.log(`✅ External game generation completed: ${files.length} files`)

      // Log all collected files for debugging
      files.forEach((file, index) => {
        console.log(`📄 File ${index + 1}: ${file.path} (${file.type}) - ${file.content.length} chars`)
      })

      return files
    } catch (error) {
      console.error(`❌ External game generation failed:`, error)
      onUpdate?.({
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Failed to generate game using external API",
      })
      throw error
    }
  }

  private getFileType(filename: string): "html" | "js" | "css" | "json" | "md" {
    const ext = filename.split(".").pop()?.toLowerCase()
    switch (ext) {
      case "html":
        return "html"
      case "js":
        return "js"
      case "css":
        return "css"
      case "json":
        return "json"
      case "md":
        return "md"
      default:
        return "js"
    }
  }

  private getLanguage(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase()
    switch (ext) {
      case "html":
        return "html"
      case "js":
        return "javascript"
      case "css":
        return "css"
      case "json":
        return "json"
      case "md":
        return "markdown"
      default:
        return "javascript"
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      console.log(`🏥 Health checking external API: ${this.baseUrl}/health`)
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      })
      const isHealthy = response.ok
      console.log(`🏥 External API health: ${isHealthy ? "✅ healthy" : "❌ unhealthy"}`)
      return isHealthy
    } catch (error) {
      console.log(`🏥 External API health check failed:`, error)
      return false
    }
  }
}
