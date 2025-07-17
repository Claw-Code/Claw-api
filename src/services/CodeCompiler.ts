import { promises as fs } from "fs"
import { join } from "path"
import { exec } from "child_process"
import { promisify } from "util"
import { v4 as uuidv4 } from "uuid"
import type { GeneratedCode, CodeFile, PreviewEnvironment } from "../types"

const execAsync = promisify(exec)

export class CodeCompiler {
  private workspaceDir: string
  private previewPort = 3000

  constructor() {
    this.workspaceDir = process.env.WORKSPACE_DIR || "./workspace"
  }

  async compileAndPreview(generatedCode: GeneratedCode): Promise<PreviewEnvironment> {
    const projectId = uuidv4()
    const projectDir = join(this.workspaceDir, projectId)

    try {
      // Create project directory
      await fs.mkdir(projectDir, { recursive: true })

      // Write files
      await this.writeFiles(projectDir, generatedCode.files)

<<<<<<< HEAD
      // Setup package.json for Phaser.js projects
      await this.setupPhaserPackageJson(projectDir, generatedCode.framework)

      // Install dependencies
      const buildLogs: string[] = []
      buildLogs.push("🎮 Setting up Phaser.js project...")

      if (generatedCode.framework === "phaser.js") {
        // For Phaser.js, we don't need npm install since it uses CDN
        buildLogs.push("✅ Phaser.js project ready (using CDN)")

        // Create a simple HTTP server for preview
        await this.createSimpleServer(projectDir)
        buildLogs.push("✅ HTTP server created for game preview")
      } else {
        // For other frameworks, install dependencies
        const { stdout: installOutput } = await execAsync("npm install", {
          cwd: projectDir,
          timeout: 120000,
        })
        buildLogs.push(installOutput)

        // Build the project
        buildLogs.push("🔨 Building project...")
        const { stdout: buildOutput } = await execAsync("npm run build", {
          cwd: projectDir,
          timeout: 180000,
        })
        buildLogs.push(buildOutput)
      }
=======
      // Setup package.json if not exists
      await this.setupPackageJson(projectDir, generatedCode.framework)

      // Install dependencies
      const buildLogs: string[] = []
      buildLogs.push("🎮 Setting up Phaser.js project...")

      if (generatedCode.framework === "phaser.js") {
        // For Phaser.js, we don't need npm install since it uses CDN
        buildLogs.push("✅ Phaser.js project ready (using CDN)")

        // Create a simple HTTP server for preview
        await this.createSimpleServer(projectDir)
        buildLogs.push("✅ HTTP server created for game preview")
      } else {
        // For other frameworks, install dependencies
        const { stdout: installOutput } = await execAsync("npm install", {
          cwd: projectDir,
          timeout: 120000,
        })
        buildLogs.push(installOutput)

      // Build the project
      buildLogs.push("Building project...")
      const { stdout: buildOutput } = await execAsync("npm run build", {
        cwd: projectDir,
        timeout: 180000,
      })
      buildLogs.push(buildOutput)
>>>>>>> d07d2a6 (Init API)

      // Start preview server
      const port = await this.getAvailablePort()
      const previewUrl = `http://localhost:${port}`

      // Start the server in background
<<<<<<< HEAD
      this.startPreviewServer(projectDir, port, generatedCode.framework)
=======
      this.startPreviewServer(projectDir, port)
>>>>>>> d07d2a6 (Init API)

      return {
        id: projectId,
        url: previewUrl,
        status: "ready",
        buildLogs,
      }
    } catch (error) {
      return {
        id: projectId,
        url: "",
        status: "error",
        buildLogs: [`Build failed: ${error}`],
      }
    }
  }

  private async writeFiles(projectDir: string, files: CodeFile[]): Promise<void> {
    for (const file of files) {
      const filePath = join(projectDir, file.path)
      const fileDir = join(filePath, "..")

      await fs.mkdir(fileDir, { recursive: true })
      await fs.writeFile(filePath, file.content, "utf8")
    }
  }

<<<<<<< HEAD
  private async setupPhaserPackageJson(projectDir: string, framework: string): Promise<void> {
=======
  private async setupPackageJson(projectDir: string, framework: string): Promise<void> {
>>>>>>> d07d2a6 (Init API)
    const packageJsonPath = join(projectDir, "package.json")

    try {
      await fs.access(packageJsonPath)
      return // package.json already exists
    } catch {
<<<<<<< HEAD
      // Create package.json based on framework
      const packageJson = this.getPhaserPackageJson(framework)
=======
      // Create default package.json
      const packageJson = this.getDefaultPackageJson(framework)
>>>>>>> d07d2a6 (Init API)
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
    }
  }

<<<<<<< HEAD
  private getPhaserPackageJson(framework: string) {
    const basePackage = {
      name: "phaser-game-generated",
      version: "1.0.0",
      private: true,
      description: "Generated Phaser.js game",
      main: "index.html",
    }

    switch (framework.toLowerCase()) {
      case "phaser.js":
      case "phaser":
        return {
          ...basePackage,
          scripts: {
            start: "http-server -p 3000 -c-1",
            dev: "http-server -p 3000 -c-1",
            build: "echo 'Phaser.js game ready for deployment'",
          },
          devDependencies: {
            "http-server": "^14.1.1",
          },
          dependencies: {
            // Phaser.js is loaded via CDN, no npm dependencies needed
          },
        }

=======
  private getDefaultPackageJson(framework: string) {
    const basePackage = {
      name: "phaser-game-generated",
      version: "1.0.0",
      private: true,
      description: "Generated Phaser.js game",
      main: "index.html",
    }

    switch (framework.toLowerCase()) {
>>>>>>> d07d2a6 (Init API)
      case "next.js":
      case "nextjs":
        return {
          ...basePackage,
<<<<<<< HEAD
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
            lint: "next lint",
          },
=======
>>>>>>> d07d2a6 (Init API)
          dependencies: {
            next: "^14.0.0",
            react: "^18.0.0",
            "react-dom": "^18.0.0",
<<<<<<< HEAD
=======
            three: "^0.158.0",
            "@react-three/fiber": "^8.15.0",
            "@react-three/drei": "^9.88.0",
>>>>>>> d07d2a6 (Init API)
            phaser: "^3.70.0",
          },
          devDependencies: {
            "@types/node": "^20.0.0",
            "@types/react": "^18.0.0",
            "@types/react-dom": "^18.0.0",
            typescript: "^5.0.0",
            eslint: "^8.0.0",
            "eslint-config-next": "^14.0.0",
          },
        }

      case "react":
        return {
          ...basePackage,
          scripts: {
            dev: "vite",
            build: "vite build",
            start: "vite preview",
            lint: "eslint src",
          },
          dependencies: {
            react: "^18.0.0",
            "react-dom": "^18.0.0",
<<<<<<< HEAD
=======
            three: "^0.158.0",
            "@react-three/fiber": "^8.15.0",
            "@react-three/drei": "^9.88.0",
>>>>>>> d07d2a6 (Init API)
            phaser: "^3.70.0",
          },
          devDependencies: {
            "@types/react": "^18.0.0",
            "@types/react-dom": "^18.0.0",
            "@vitejs/plugin-react": "^4.0.0",
            typescript: "^5.0.0",
            vite: "^5.0.0",
          },
        }

      default:
        return basePackage
    }
  }

<<<<<<< HEAD
  private async createSimpleServer(projectDir: string): Promise<void> {
    // Create a simple Node.js server for Phaser.js games
    const serverCode = `
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  
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
  }
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Phaser.js game server running on port ' + PORT);
});
`

    await fs.writeFile(join(projectDir, "server.js"), serverCode)
  }

=======
>>>>>>> d07d2a6 (Init API)
  private async getAvailablePort(): Promise<number> {
    const net = await import("net")

    return new Promise((resolve) => {
      const server = net.createServer()
      server.listen(0, () => {
        const port = (server.address() as any)?.port || 3000
        server.close(() => resolve(port))
      })
    })
  }

<<<<<<< HEAD
  private startPreviewServer(projectDir: string, port: number, framework: string): void {
    const { spawn } = require("child_process")

    let command: string
    let args: string[]

    if (framework === "phaser.js") {
      // Use the simple Node.js server for Phaser.js games
      command = "node"
      args = ["server.js"]
    } else {
      // Use npm start for other frameworks
      command = "npm"
      args = ["start"]
    }

    const server = spawn(command, args, {
=======
  private startPreviewServer(projectDir: string, port: number): void {
    const { spawn } = require("child_process")

    const server = spawn("npm", ["start"], {
>>>>>>> d07d2a6 (Init API)
      cwd: projectDir,
      env: { ...process.env, PORT: port.toString() },
      detached: true,
      stdio: "ignore",
    })

    server.unref()
  }

  async generateDownloadLink(generatedCode: GeneratedCode): Promise<string> {
    const archiver = require("archiver")
    const { createWriteStream } = require("fs")
    const { join } = require("path")

    const downloadId = uuidv4()
    const zipPath = join(this.workspaceDir, "downloads", `${downloadId}.zip`)

    await fs.mkdir(join(this.workspaceDir, "downloads"), { recursive: true })

    const output = createWriteStream(zipPath)
    const archive = archiver("zip", { zlib: { level: 9 } })

    archive.pipe(output)

    // Add files to archive
    for (const file of generatedCode.files) {
      archive.append(file.content, { name: file.path })
    }

<<<<<<< HEAD
    // Add README for Phaser.js projects
    if (generatedCode.framework === "phaser.js") {
      const readme = `# Phaser.js Game

This is a generated Phaser.js game created by Claw API.

## How to Run

1. Open \`index.html\` in a web browser
2. Or serve it with a local HTTP server:
   \`\`\`bash
   npx http-server -p 3000
   \`\`\`

## Game Features

- Built with Phaser.js 3.x
- Responsive design for mobile and desktop
- Modern JavaScript (ES6+)
- Optimized for performance
- Cross-browser compatible

## Customization

- Edit \`game.js\` to modify game logic
- Modify \`index.html\` for styling changes
- Add assets to enhance the game experience

Enjoy your game!
`
      archive.append(readme, { name: "README.md" })
    }

=======
>>>>>>> d07d2a6 (Init API)
    await archive.finalize()

    return `/api/download/${downloadId}`
  }
}
