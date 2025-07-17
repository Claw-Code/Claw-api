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

      // Setup package.json if not exists
      await this.setupPackageJson(projectDir, generatedCode.framework)

      // Install dependencies
      const buildLogs: string[] = []
      buildLogs.push("Installing dependencies...")

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

      // Start preview server
      const port = await this.getAvailablePort()
      const previewUrl = `http://localhost:${port}`

      // Start the server in background
      this.startPreviewServer(projectDir, port)

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

  private async setupPackageJson(projectDir: string, framework: string): Promise<void> {
    const packageJsonPath = join(projectDir, "package.json")

    try {
      await fs.access(packageJsonPath)
      return // package.json already exists
    } catch {
      // Create default package.json
      const packageJson = this.getDefaultPackageJson(framework)
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
    }
  }

  private getDefaultPackageJson(framework: string) {
    const basePackage = {
      name: "generated-project",
      version: "1.0.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
    }

    switch (framework.toLowerCase()) {
      case "next.js":
      case "nextjs":
        return {
          ...basePackage,
          dependencies: {
            next: "^14.0.0",
            react: "^18.0.0",
            "react-dom": "^18.0.0",
            three: "^0.158.0",
            "@react-three/fiber": "^8.15.0",
            "@react-three/drei": "^9.88.0",
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
            three: "^0.158.0",
            "@react-three/fiber": "^8.15.0",
            "@react-three/drei": "^9.88.0",
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

  private startPreviewServer(projectDir: string, port: number): void {
    const { spawn } = require("child_process")

    const server = spawn("npm", ["start"], {
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

    await archive.finalize()

    return `/api/download/${downloadId}`
  }
}
