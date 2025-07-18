"use client"

import { useEffect } from "react"
import { useStreamingResponse } from "../hooks/useStreamingResponse"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Loader2, Brain, FileText, Code, CheckCircle, AlertCircle } from "lucide-react"

interface StreamingResponseProps {
  streamUrl?: string
  token: string
  onComplete?: (response: any) => void
}

export function StreamingResponse({ streamUrl, token, onComplete }: StreamingResponseProps) {
  const {
    isConnected,
    isGenerating,
    currentPhase,
    thinkingContent,
    textContent,
    files,
    error,
    progress,
    connectToStream,
    disconnect,
    reset,
  } = useStreamingResponse()

  useEffect(() => {
    if (streamUrl) {
      connectToStream(streamUrl, token)
    }
    return () => disconnect()
  }, [streamUrl, token, connectToStream, disconnect])

  useEffect(() => {
    if (currentPhase === "complete" && onComplete) {
      onComplete({ textContent, files })
    }
  }, [currentPhase, textContent, files, onComplete])

  const getPhaseIcon = () => {
    switch (currentPhase) {
      case "thinking":
      case "thinking_detail":
        return <Brain className="w-4 h-4 animate-pulse" />
      case "generating_text":
      case "text_complete":
        return <FileText className="w-4 h-4" />
      case "generating_code":
      case "generating_file":
        return <Code className="w-4 h-4" />
      case "verifying":
        return <Loader2 className="w-4 h-4 animate-spin" />
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Loader2 className="w-4 h-4 animate-spin" />
    }
  }

  const getPhaseLabel = () => {
    switch (currentPhase) {
      case "connecting":
        return "Connecting..."
      case "connected":
        return "Connected"
      case "thinking":
        return "Thinking"
      case "thinking_detail":
        return "Analyzing"
      case "generating_text":
        return "Writing Documentation"
      case "text_complete":
        return "Documentation Complete"
      case "generating_code":
        return "Generating Code"
      case "generating_file":
        return "Creating Files"
      case "verifying":
        return "Verifying Code"
      case "complete":
        return "Complete"
      case "error":
        return "Error"
      default:
        return "Processing"
    }
  }

  if (!streamUrl) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getPhaseIcon()}
              <span className="font-medium">{getPhaseLabel()}</span>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            {isGenerating && (
              <div className="flex items-center gap-2">
                <Progress value={progress} className="w-32" />
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Thinking Phase */}
      {(currentPhase === "thinking" || currentPhase === "thinking_detail") && thinkingContent && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 animate-pulse text-blue-500" />
              <span className="font-medium text-blue-700">AI Thinking</span>
            </div>
            <p className="text-sm text-muted-foreground">{thinkingContent}</p>
          </CardContent>
        </Card>
      )}

      {/* Text Content */}
      {textContent && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-green-500" />
              <span className="font-medium">Game Documentation</span>
            </div>
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: textContent.replace(/\n/g, "<br>") }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Code Files */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Generated Files</span>
              <Badge variant="outline">{files.length} files</Badge>
            </div>
            <div className="space-y-3">
              {files.map((file, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">{file.path}</span>
                      <Badge variant="secondary" className="text-xs">
                        {file.type?.toUpperCase()}
                      </Badge>
                    </div>
                    {file.isComplete ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    )}
                  </div>
                  {file.description && <p className="text-xs text-muted-foreground mb-2">{file.description}</p>}
                  {file.content && (
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto max-h-32">
                      <code>{file.content}</code>
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Phase */}
      {currentPhase === "verifying" && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="font-medium">Verifying Code Quality</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Checking Phaser.js best practices and code quality...</p>
          </CardContent>
        </Card>
      )}

      {/* Completion */}
      {currentPhase === "complete" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Generation Complete!</span>
            </div>
            <p className="text-green-600 mt-1">
              Your Phaser.js game has been generated successfully. You can now preview and download the files.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
