import { spawn } from "node:child_process"
import { z } from "zod"

export type AIErrorType =
  | "auth"
  | "rate_limit"
  | "server"
  | "network"
  | "config"
  | "invalid_response"

export class AIError extends Error {
  type: AIErrorType
  status?: number

  constructor(message: string, type: AIErrorType, status?: number) {
    super(message)
    this.name = "AIError"
    this.type = type
    this.status = status
  }
}

export interface ClaudeCliRequest {
  systemPrompt: string
  userPrompt: string
  // Accepted for signature compatibility with callOpenClaw, but ignored:
  // the `claude` CLI has no equivalent flag, and output length is steered
  // by the system prompt instead.
  maxTokens?: number
}

export interface ClaudeCliResponse {
  content: string
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
}

const claudeJsonSchema = z.object({
  type: z.string().optional(),
  is_error: z.boolean().optional(),
  result: z.string(),
  usage: z
    .object({
      input_tokens: z.number().optional(),
      output_tokens: z.number().optional(),
    })
    .passthrough()
    .optional(),
})

function getTimeoutMs(): number {
  const raw = process.env.CLAUDE_TIMEOUT_MS
  const parsed = raw ? Number.parseInt(raw, 10) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 120_000
}

function getBinPath(): string {
  return process.env.CLAUDE_BIN_PATH || "claude"
}

export async function callClaudeCli({
  systemPrompt,
  userPrompt,
}: ClaudeCliRequest): Promise<ClaudeCliResponse> {
  const bin = getBinPath()
  const timeoutMs = getTimeoutMs()

  return new Promise<ClaudeCliResponse>((resolve, reject) => {
    let child
    try {
      child = spawn(
        bin,
        ["-p", "--output-format", "json", "--append-system-prompt", systemPrompt],
        { stdio: ["pipe", "pipe", "pipe"] }
      )
    } catch (error) {
      reject(
        new AIError(
          error instanceof Error ? error.message : "failed to spawn claude CLI",
          "config"
        )
      )
      return
    }

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []
    let settled = false
    let killTimer: NodeJS.Timeout | null = null

    const timeoutTimer = setTimeout(() => {
      if (settled) return
      child.kill("SIGTERM")
      killTimer = setTimeout(() => {
        if (!child.killed) child.kill("SIGKILL")
      }, 5_000)
      finish(
        new AIError(`claude CLI timed out after ${timeoutMs}ms`, "server")
      )
    }, timeoutMs)

    function finish(err: AIError | null, value?: ClaudeCliResponse) {
      if (settled) return
      settled = true
      clearTimeout(timeoutTimer)
      if (killTimer) clearTimeout(killTimer)
      if (err) reject(err)
      else if (value) resolve(value)
    }

    child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk))
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk))

    child.on("error", (error) => {
      finish(
        new AIError(
          error instanceof Error ? error.message : "claude CLI spawn error",
          "network"
        )
      )
    })

    child.on("close", (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString("utf-8")
      const stderr = Buffer.concat(stderrChunks).toString("utf-8")

      if (code !== 0) {
        finish(
          new AIError(
            `claude CLI exited with code ${code}: ${stderr.trim() || "(no stderr)"}`,
            "server",
            code ?? undefined
          )
        )
        return
      }

      let raw: unknown
      try {
        raw = JSON.parse(stdout)
      } catch {
        finish(
          new AIError(
            `claude CLI stdout is not valid JSON: ${stdout.slice(0, 200)}`,
            "invalid_response"
          )
        )
        return
      }

      const parsed = claudeJsonSchema.safeParse(raw)
      if (!parsed.success) {
        finish(
          new AIError("claude CLI response shape is invalid", "invalid_response")
        )
        return
      }

      if (parsed.data.is_error) {
        finish(
          new AIError(
            `claude CLI reported error: ${parsed.data.result}`,
            "server"
          )
        )
        return
      }

      const content = parsed.data.result.trim()
      if (!content) {
        finish(
          new AIError("claude CLI returned empty result", "invalid_response")
        )
        return
      }

      const usage = parsed.data.usage
      const promptTokens = usage?.input_tokens
      const completionTokens = usage?.output_tokens
      const totalTokens =
        promptTokens != null && completionTokens != null
          ? promptTokens + completionTokens
          : undefined

      finish(null, {
        content,
        usage:
          promptTokens != null || completionTokens != null
            ? { promptTokens, completionTokens, totalTokens }
            : undefined,
      })
    })

    child.stdin.on("error", (error) => {
      finish(
        new AIError(
          error instanceof Error ? error.message : "claude CLI stdin error",
          "network"
        )
      )
    })

    child.stdin.write(userPrompt, "utf-8", (error) => {
      if (error) {
        finish(
          new AIError(
            error instanceof Error ? error.message : "claude CLI stdin write failed",
            "network"
          )
        )
        return
      }
      child.stdin.end()
    })
  })
}
