import type { GameFile, ExternalAPIResponse, FileGeneratedEvent, CompleteEvent } from "../types"

export class ExternalGameAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.EXTERNAL_GAME_API_URL || "http://localhost:3001"
  }

  async generateGame(prompt: string, onUpdate?: (event: any) => void): Promise<GameFile[]> {
    console.log(`🎮 Starting external game generation for: ${prompt.substring(0, 100)}...`)

    try {
      const response = await fetch(`${this.baseUrl}/api/generate/simple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error(`External API error: ${response.status} ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error("No response body received from external API")
      }

      const files: GameFile[] = []
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.trim() === "") continue

            try {
              // Parse SSE format: "event: eventType\ndata: jsonData"
              if (line.startsWith("event: ")) {
                continue // Skip event type line
              }

              if (line.startsWith("data: ")) {
                const jsonData = line.substring(6) // Remove "data: " prefix
                const eventData = JSON.parse(jsonData)

                // Handle different event types
                if (eventData.step !== undefined) {
                  // Progress event
                  const progressEvent: ExternalAPIResponse = eventData
                  console.log(`📊 Progress: ${progressEvent.stepName} (${progressEvent.progress}%)`)

                  onUpdate?.({
                    type: "progress",
                    step: progressEvent.step,
                    totalSteps: progressEvent.totalSteps,
                    stepName: progressEvent.stepName,
                    progress: progressEvent.progress,
                    message: progressEvent.message,
                  })
                } else if (eventData.filename) {
                  // File generated event
                  const fileEvent: FileGeneratedEvent = eventData
                  console.log(`📄 File generated: ${fileEvent.filename}`)

                  const gameFile: GameFile = {
                    path: fileEvent.filename,
                    content: fileEvent.content,
                    type: this.getFileType(fileEvent.filename),
                    language: this.getLanguage(fileEvent.filename),
                  }

                  files.push(gameFile)

                  onUpdate?.({
                    type: "file_generated",
                    file: gameFile,
                  })
                } else if (eventData.files) {
                  // Complete event
                  const completeEvent: CompleteEvent = eventData
                  console.log(`✅ Generation complete: ${completeEvent.files.length} files`)

                  // Add any remaining files
                  for (const file of completeEvent.files) {
                    if (!files.find((f) => f.path === file.path)) {
                      files.push(file)
                    }
                  }

                  onUpdate?.({
                    type: "complete",
                    files: files,
                    metadata: completeEvent.metadata,
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
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        timeout: 5000,
      })
      return response.ok
    } catch {
      return false
    }
  }
}
