"use client"

import { useState, useEffect, useCallback } from "react"

interface StreamingUpdate {
  type: string
  content?: string
  chunk?: string
  fileName?: string
  file?: any
  error?: string
  response?: any
  [key: string]: any
}

interface StreamingState {
  isConnected: boolean
  isGenerating: boolean
  currentPhase: string
  thinkingContent: string
  textContent: string
  files: any[]
  error: string | null
  progress: number
}

export function useStreamingResponse() {
  const [state, setState] = useState<StreamingState>({
    isConnected: false,
    isGenerating: false,
    currentPhase: "idle",
    thinkingContent: "",
    textContent: "",
    files: [],
    error: null,
    progress: 0,
  })

  const [eventSource, setEventSource] = useState<EventSource | null>(null)

  const connectToStream = useCallback(
    (streamUrl: string, token: string) => {
      if (eventSource) {
        eventSource.close()
      }

      const es = new EventSource(`${streamUrl}?token=${token}`)
      setEventSource(es)

      setState((prev) => ({
        ...prev,
        isConnected: false,
        isGenerating: true,
        currentPhase: "connecting",
        error: null,
      }))

      es.onopen = () => {
        setState((prev) => ({ ...prev, isConnected: true, currentPhase: "connected" }))
      }

      es.onmessage = (event) => {
        try {
          const update: StreamingUpdate = JSON.parse(event.data)
          handleStreamingUpdate(update)
        } catch (error) {
          console.error("Failed to parse streaming update:", error)
        }
      }

      es.onerror = (error) => {
        console.error("EventSource error:", error)
        setState((prev) => ({
          ...prev,
          isConnected: false,
          error: "Connection lost. Please try again.",
          isGenerating: false,
        }))
        es.close()
      }

      return es
    },
    [eventSource],
  )

  const handleStreamingUpdate = useCallback((update: StreamingUpdate) => {
    setState((prev) => {
      const newState = { ...prev }

      switch (update.type) {
        case "connected":
          newState.isConnected = true
          newState.currentPhase = "ready"
          break

        case "thinking":
          newState.currentPhase = "thinking"
          newState.thinkingContent = update.content || ""
          break

        case "thinking_detail":
          newState.currentPhase = "thinking"
          newState.thinkingContent = update.content || ""
          break

        case "text_start":
          newState.currentPhase = "generating_text"
          newState.textContent = ""
          break

        case "text_chunk":
          newState.textContent += update.chunk || ""
          if (update.isComplete) {
            newState.currentPhase = "text_complete"
          }
          break

        case "code_start":
          newState.currentPhase = "generating_code"
          newState.files = []
          newState.progress = 0
          break

        case "file_start":
          newState.currentPhase = "generating_file"
          newState.files.push({
            path: update.fileName,
            type: update.fileType,
            content: "",
            description: update.description,
            isComplete: false,
          })
          break

        case "file_chunk":
          const fileIndex = newState.files.findIndex((f) => f.path === update.fileName)
          if (fileIndex !== -1) {
            newState.files[fileIndex].content += update.chunk || ""
            newState.progress = update.progress || 0
            if (update.isComplete) {
              newState.files[fileIndex].isComplete = true
            }
          }
          break

        case "file_complete":
          const completedFileIndex = newState.files.findIndex((f) => f.path === update.fileName)
          if (completedFileIndex !== -1) {
            newState.files[completedFileIndex] = { ...update.file, isComplete: true }
          }
          newState.progress = (update.fileIndex / update.totalFiles) * 100
          break

        case "verification":
          newState.currentPhase = "verifying"
          newState.thinkingContent = update.content || ""
          break

        case "generation_complete":
          newState.currentPhase = "complete"
          newState.isGenerating = false
          newState.progress = 100
          break

        case "complete":
          newState.currentPhase = "complete"
          newState.isGenerating = false
          newState.progress = 100
          // Handle final response if needed
          break

        case "error":
          newState.error = update.error || "An error occurred"
          newState.isGenerating = false
          newState.currentPhase = "error"
          break

        case "end":
          newState.isGenerating = false
          if (newState.currentPhase !== "error") {
            newState.currentPhase = "complete"
          }
          break

        case "ping":
          // Keep-alive, no state change needed
          break

        default:
          console.log("Unknown update type:", update.type)
      }

      return newState
    })
  }, [])

  const disconnect = useCallback(() => {
    if (eventSource) {
      eventSource.close()
      setEventSource(null)
    }
    setState((prev) => ({
      ...prev,
      isConnected: false,
      isGenerating: false,
    }))
  }, [eventSource])

  const reset = useCallback(() => {
    setState({
      isConnected: false,
      isGenerating: false,
      currentPhase: "idle",
      thinkingContent: "",
      textContent: "",
      files: [],
      error: null,
      progress: 0,
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [eventSource])

  return {
    ...state,
    connectToStream,
    disconnect,
    reset,
  }
}
