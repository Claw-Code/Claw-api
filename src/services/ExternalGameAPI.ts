import type { GameFile } from "../types";
import { ConversationModel } from "../models/Conversation";

export class ExternalGameAPI {
  private baseUrl: string;
  private conversationModel?: ConversationModel;

  constructor(conversationModel?: ConversationModel) {
    this.baseUrl = process.env.EXTERNAL_GAME_API_URL || "http://localhost:3005";
    this.conversationModel = conversationModel;
  }

  async generateGame(
    prompt: string,
    subdomain: string,
    apiVersion: "simple2" = "simple2",
    onUpdate?: (event: any) => void
  ): Promise<GameFile[]> {
    const endpoint = "/api/generate/simple2";
    console.log(`🎮 Starting external game generation for: ${prompt.substring(0, 100)}...`);
    console.log(`🌐 External API URL: ${this.baseUrl}${endpoint}`);
    console.log(`🏷️ Subdomain: ${subdomain}`);

    try {
      const requestBody = { prompt, subdomain };
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ External API error response:`, errorText);
        throw new Error(`External API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error("No response body received from external API");
      }

      const files: GameFile[] = [];
      let liveUrl: string | null = null;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log(`🔚 Stream reading completed`);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.trim() === "") continue;

            try {
              if (line.startsWith("data: ")) {
                const jsonData = line.substring(6);
                const eventData = JSON.parse(jsonData);
                console.log(`📨 Received event:`, eventData.type || "file_event", eventData);

                if (eventData.step !== undefined) {
                  if (onUpdate) {
                    onUpdate({
                      type: "progress",
                      step: eventData.step,
                      totalSteps: eventData.totalSteps,
                      stepName: eventData.stepName,
                      progress: eventData.progress,
                      message: eventData.message,
                      timestamp: eventData.timestamp,
                    });
                  } else {
                    console.log(`📊 Progress: ${eventData.stepName} (${eventData.progress}%)`);
                  }
                } else if (eventData.fileName && eventData.content) {
                  const gameFile: GameFile = {
                    path: eventData.fileName,
                    content: eventData.content,
                    type: this.getFileType(eventData.fileName),
                    language: this.getLanguage(eventData.fileName),
                  };
                  files.push(gameFile);
                  if (onUpdate) {
                    onUpdate({
                      type: "file_generated",
                      file: gameFile,
                      fileName: eventData.fileName,
                      fileType: eventData.fileType,
                      index: eventData.index,
                      totalFiles: eventData.totalFiles,
                      timestamp: eventData.timestamp,
                    });
                  }
                } else if (eventData.filename && eventData.content) {
                  const gameFile: GameFile = {
                    path: eventData.filename,
                    content: eventData.content,
                    type: this.getFileType(eventData.filename),
                    language: this.getLanguage(eventData.filename),
                  };
                  files.push(gameFile);
                  if (onUpdate) {
                    onUpdate({
                      type: "file_generated",
                      file: gameFile,
                      fileName: eventData.filename,
                      fileType: eventData.fileType,
                      index: eventData.index,
                      totalFiles: eventData.totalFiles,
                      timestamp: eventData.timestamp,
                    });
                  }
                } else if (eventData.files) {
                  for (const file of eventData.files) {
                    if (!files.find((f) => f.path === file.path)) {
                      const gameFile: GameFile = {
                        path: file.path,
                        content: file.content,
                        type: this.getFileType(file.path),
                        language: this.getLanguage(file.path),
                      };
                      files.push(gameFile);
                    }
                  }
                  if (onUpdate) {
                    onUpdate({
                      type: "complete",
                      files: files,
                      metadata: eventData.metadata,
                      timestamp: eventData.timestamp,
                    });
                  }
                } else if (eventData.chatId && eventData.projectId && eventData.setupInstructions) {
                  liveUrl = eventData.setupInstructions.liveUrl || eventData.setupInstructions.url || null;
                  console.log(`🌐 Extracted live URL: ${liveUrl}`);
                  if (onUpdate) {
                    onUpdate({
                      type: "complete",
                      files: files,
                      liveUrl,
                      metadata: {
                        gameType: eventData.chainUsed === "simple2-react" ? "React Game" : "Unknown Game",
                        framework: eventData.chainUsed === "simple2-react" ? "React" : "Unknown",
                        totalFiles: eventData.totalFiles,
                        projectId: eventData.projectId,
                        chainUsed: eventData.chainUsed,
                        chainSteps: eventData.chainSteps,
                        liveUrl,
                      },
                      setupInstructions: eventData.setupInstructions,
                      validation: eventData.validation,
                      timestamp: eventData.timestamp,
                    });
                  }
                } else if (eventData.error) {
                  console.error(`❌ External API error:`, eventData);
                  if (onUpdate) {
                    onUpdate({
                      type: "error",
                      error: eventData.error,
                      details: eventData.details,
                      timestamp: eventData.timestamp,
                    });
                  }
                  throw new Error(eventData.error);
                } else {
                  console.log(`🔍 Unknown event type:`, eventData);
                }
              }
            } catch (parseError) {
              console.warn(`⚠️ Failed to parse SSE line: ${line}`, parseError);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      console.log(`✅ External game generation completed: ${files.length} files`);
      return files;
    } catch (error) {
      console.error(`❌ External game generation failed:`, error);
      if (onUpdate) {
        onUpdate({
          type: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          details: "Failed to generate game using external API",
        });
      }
      throw error;
    }
  }

  private getFileType(filename: string): "html" | "js" | "css" | "json" | "md" | "tsx" {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "html":
        return "html";
      case "js":
        return "js";
      case "css":
        return "css";
      case "json":
        return "json";
      case "md":
        return "md";
      case "tsx":
        return "tsx";
      default:
        return "js";
    }
  }

  private getLanguage(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "html":
        return "html";
      case "js":
        return "javascript";
      case "css":
        return "css";
      case "json":
        return "json";
      case "md":
        return "markdown";
      case "tsx":
        return "typescript";
      default:
        return "javascript";
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      console.log(`🏥 Health checking external API: ${this.baseUrl}/health`);
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      const isHealthy = response.ok;
      console.log(`🏥 External API health: ${isHealthy ? "✅ healthy" : "❌ unhealthy"}`);
      return isHealthy;
    } catch (error) {
      console.log(`🏥 External API health check failed:`, error);
      return false;
    }
  }
}