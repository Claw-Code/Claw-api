import { promises as fs } from "fs"
import { join } from "path"
import { exec } from "child_process"
import { promisify } from "util"
import { v4 as uuidv4 } from "uuid"
import type { GeneratedCode, CodeFile, PreviewEnvironment } from "../types"

const execAsync = promisify(exec)

export class CodeCompiler {
  private workspaceDir: string
  private runningPreviews: Map<string, any> = new Map()

  constructor() {
    this.workspaceDir = process.env.WORKSPACE_DIR || "./workspace"
    console.log(`🔧 CodeCompiler initialized with workspace: ${this.workspaceDir}`)
  }

  async compileAndPreview(generatedCode: GeneratedCode): Promise<PreviewEnvironment> {
    const projectId = uuidv4()
    const projectDir = join(this.workspaceDir, projectId)

    console.log(`🚀 DEBUG: Starting compileAndPreview for project ${projectId}`)
    console.log(`🚀 DEBUG: Project directory: ${projectDir}`)
    console.log(`🚀 DEBUG: Generated code files: ${generatedCode.files.length}`)

    try {
      // Create project directory
      console.log(`📁 DEBUG: Creating project directory...`)
      await fs.mkdir(projectDir, { recursive: true })
      console.log(`✅ DEBUG: Project directory created`)

      // Write all files
      console.log(`📄 DEBUG: Writing files...`)
      await this.writeFiles(projectDir, generatedCode.files)
      console.log(`✅ DEBUG: Files written`)

      // Create package.json for Phaser.js
      console.log(`📦 DEBUG: Creating package.json...`)
      await this.createPhaserPackageJson(projectDir)
      console.log(`✅ DEBUG: Package.json created`)

      const buildLogs: string[] = []
      buildLogs.push("🎮 Setting up Phaser.js project...")

      // Get available port FIRST
      console.log(`🔌 DEBUG: Getting available port...`)
      const port = await this.getAvailablePort()
      console.log(`✅ DEBUG: Got port: ${port}`)
      const previewUrl = `http://localhost:${port}`

      // Start simple HTTP server
      console.log(`🚀 DEBUG: Starting server on port ${port}...`)
      const serverStarted = await this.startSimpleServer(projectDir, port, projectId)

      if (serverStarted) {
        buildLogs.push(`✅ Server started on port ${port}`)
        console.log(`✅ DEBUG: Server started successfully on ${previewUrl}`)

        return {
          id: projectId,
          url: previewUrl,
          status: "ready",
          buildLogs,
        }
      } else {
        console.log(`❌ DEBUG: Server failed to start`)
        return {
          id: projectId,
          url: "",
          status: "error",
          buildLogs: ["❌ Failed to start preview server"],
        }
      }
    } catch (error) {
      console.error(`❌ DEBUG: Preview failed for ${projectId}:`, error)
      return {
        id: projectId,
        url: "",
        status: "error",
        buildLogs: [`Build failed: ${error instanceof Error ? error.message : "Unknown error"}`],
      }
    }
  }

  private async writeFiles(projectDir: string, files: CodeFile[]): Promise<void> {
    console.log(`📄 DEBUG: Writing ${files.length} files to ${projectDir}`)

    for (const file of files) {
      const filePath = join(projectDir, file.path)
      const fileDir = join(filePath, "..")

      console.log(`📄 DEBUG: Writing file: ${file.path} (${file.content.length} chars)`)
      await fs.mkdir(fileDir, { recursive: true })
      await fs.writeFile(filePath, file.content, "utf8")
      console.log(`✅ DEBUG: Written file: ${file.path}`)
    }
  }

  private async createPhaserPackageJson(projectDir: string): Promise<void> {
    const packageJson = {
      name: "phaser-game-preview",
      version: "1.0.0",
      private: true,
      description: "Generated Phaser.js game preview",
      main: "index.html",
      scripts: {
        start: "node server.js",
        dev: "node server.js",
      },
      dependencies: {
        phaser: "^3.70.0",
      },
    }

    const packagePath = join(projectDir, "package.json")
    await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2))
    console.log(`📦 DEBUG: Package.json written to ${packagePath}`)
  }

  private async startSimpleServer(projectDir: string, port: number, projectId: string): Promise<boolean> {
    console.log(`🚀 DEBUG: startSimpleServer called for ${projectId} on port ${port}`)

    try {
      // Create a simple Node.js server script
      const serverScript = `
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Phaser.js preview server...');

const server = http.createServer((req, res) => {
  console.log('📥 Request:', req.method, req.url);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  console.log('📄 Serving file:', filePath);
  
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
    case '.gif':
      contentType = 'image/gif';
      break;
  }
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      console.error('❌ File error:', error.code, filePath);
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found: ' + req.url);
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      console.log('✅ Serving:', filePath, 'as', contentType);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = ${port};
server.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Phaser.js preview server running on http://localhost:' + PORT);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Preview server stopped');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Preview server stopped');
    process.exit(0);
  });
});
`

      const serverPath = join(projectDir, "server.js")
      await fs.writeFile(serverPath, serverScript)
      console.log(`📄 DEBUG: Server script written to ${serverPath}`)

      // Start the server using spawn
      const { spawn } = require("child_process")

      console.log(`🚀 DEBUG: Spawning node process...`)
      const serverProcess = spawn("node", ["server.js"], {
        cwd: projectDir,
        detached: false,
        stdio: ["ignore", "pipe", "pipe"],
      })

      console.log(`🚀 DEBUG: Server process spawned with PID: ${serverProcess.pid}`)

      // Store the process for cleanup
      this.runningPreviews.set(projectId, serverProcess)

      // Set up logging
      serverProcess.stdout?.on("data", (data) => {
        console.log(`📡 Preview ${projectId}: ${data.toString().trim()}`)
      })

      serverProcess.stderr?.on("data", (data) => {
        console.error(`❌ Preview ${projectId} error: ${data.toString().trim()}`)
      })

      serverProcess.on("exit", (code, signal) => {
        console.log(`🔚 Preview ${projectId} exited with code ${code}, signal ${signal}`)
        this.runningPreviews.delete(projectId)
      })

      serverProcess.on("error", (error) => {
        console.error(`❌ Preview ${projectId} spawn error:`, error)
        this.runningPreviews.delete(projectId)
      })

      // Wait for server to start and test it
      console.log(`⏳ DEBUG: Waiting for server to start...`)
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Test if server is actually running
      console.log(`🧪 DEBUG: Testing server at http://localhost:${port}`)
      try {
        const testResponse = await fetch(`http://localhost:${port}`, {
          method: "GET",
          timeout: 5000,
        })
        console.log(`🧪 DEBUG: Server test response: ${testResponse.status}`)

        if (testResponse.ok) {
          console.log(`✅ DEBUG: Server is responding correctly`)
          return true
        } else {
          console.log(`❌ DEBUG: Server responded with error: ${testResponse.status}`)
          return false
        }
      } catch (testError) {
        console.error(`❌ DEBUG: Server test failed:`, testError)
        return false
      }
    } catch (error) {
      console.error(`❌ DEBUG: Failed to start server:`, error)
      return false
    }
  }

  private async getAvailablePort(): Promise<number> {
    const net = await import("net")

    return new Promise((resolve) => {
      const server = net.createServer()
      server.listen(0, () => {
        const port = (server.address() as any)?.port || 3000
        console.log(`🔌 DEBUG: Found available port: ${port}`)
        server.close(() => resolve(port))
      })
    })
  }

  async generateDownloadLink(generatedCode: GeneratedCode): Promise<string> {
    console.log(`📦 DEBUG: generateDownloadLink called`)
    console.log(`📦 DEBUG: Files to zip: ${generatedCode.files.length}`)

    try {
      const archiver = require("archiver")
      const { createWriteStream } = require("fs")

      const downloadId = uuidv4()
      const downloadsDir = join(this.workspaceDir, "downloads")
      const zipPath = join(downloadsDir, `${downloadId}.zip`)

      console.log(`📦 DEBUG: Download ID: ${downloadId}`)
      console.log(`📦 DEBUG: Downloads dir: ${downloadsDir}`)
      console.log(`📦 DEBUG: Zip path: ${zipPath}`)

      // Ensure downloads directory exists
      await fs.mkdir(downloadsDir, { recursive: true })
      console.log(`📁 DEBUG: Downloads directory created/verified`)

      const output = createWriteStream(zipPath)
      const archive = archiver("zip", { zlib: { level: 9 } })

      return new Promise((resolve, reject) => {
        output.on("close", () => {
          const downloadUrl = `/api/download/${downloadId}`
          console.log(`✅ DEBUG: ZIP created successfully: ${zipPath}`)
          console.log(`✅ DEBUG: Download URL: ${downloadUrl}`)
          console.log(`✅ DEBUG: ZIP size: ${archive.pointer()} bytes`)
          resolve(downloadUrl)
        })

        archive.on("error", (err) => {
          console.error(`❌ DEBUG: Archive error:`, err)
          reject(err)
        })

        output.on("error", (err) => {
          console.error(`❌ DEBUG: Output stream error:`, err)
          reject(err)
        })

        archive.pipe(output)

        // Add files to archive
        console.log(`📦 DEBUG: Adding ${generatedCode.files.length} files to archive...`)
        for (const file of generatedCode.files) {
          console.log(`📄 DEBUG: Adding file to zip: ${file.path}`)
          archive.append(file.content, { name: file.path })
        }

        // Add package.json
        const packageJson = {
          name: "phaser-game-generated",
          version: "1.0.0",
          description: "Generated Phaser.js game",
          main: "index.html",
          scripts: {
            start: "node server.js",
            dev: "node server.js",
          },
          dependencies: {
            phaser: "^3.70.0",
          },
        }

        console.log(`📦 DEBUG: Adding package.json to zip`)
        archive.append(JSON.stringify(packageJson, null, 2), { name: "package.json" })

        // Add server.js for local running
        const serverScript = `
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg': contentType = 'image/jpg'; break;
  }
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(error.code === 'ENOENT' ? 404 : 500);
      res.end(error.code === 'ENOENT' ? 'File not found' : 'Server error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Phaser.js game server running on http://localhost:' + PORT);
});
`

        console.log(`📦 DEBUG: Adding server.js to zip`)
        archive.append(serverScript, { name: "server.js" })

        // Add README
        const readme = `# Phaser.js Game

This is a generated Phaser.js game created by Claw API.

## How to Run

1. Start the server:
   \`\`\`bash
   node server.js
   \`\`\`

2. Open http://localhost:3005 in your browser

## Alternative (No server required)

Simply open \`index.html\` in a modern web browser.

## Game Features

- Built with Phaser.js 3.x
- Responsive design for mobile and desktop
- Modern JavaScript (ES6+)
- Optimized for performance
- Cross-browser compatible

Enjoy your game!
`
        console.log(`📦 DEBUG: Adding README.md to zip`)
        archive.append(readme, { name: "README.md" })

        console.log(`📦 DEBUG: Finalizing archive...`)
        archive.finalize()
      })
    } catch (error) {
      console.error(`❌ DEBUG: generateDownloadLink failed:`, error)
      throw error
    }
  }

  // Debug method to check running previews
  getRunningPreviews(): { [key: string]: any } {
    const previews: { [key: string]: any } = {}
    for (const [projectId, process] of this.runningPreviews) {
      previews[projectId] = {
        pid: process.pid,
        killed: process.killed,
        exitCode: process.exitCode,
      }
    }
    console.log(`🔍 DEBUG: Running previews:`, previews)
    return previews
  }

  // Cleanup method
  stopPreview(projectId: string): void {
    const process = this.runningPreviews.get(projectId)
    if (process) {
      process.kill("SIGTERM")
      this.runningPreviews.delete(projectId)
      console.log(`🛑 DEBUG: Stopped preview ${projectId}`)
    } else {
      console.log(`⚠️ DEBUG: No preview found for ${projectId}`)
    }
  }

  // Cleanup all previews
  stopAllPreviews(): void {
    console.log(`🛑 DEBUG: Stopping all previews (${this.runningPreviews.size} running)`)
    for (const [projectId, process] of this.runningPreviews) {
      process.kill("SIGTERM")
      console.log(`🛑 DEBUG: Stopped preview ${projectId}`)
    }
    this.runningPreviews.clear()
  }
}
