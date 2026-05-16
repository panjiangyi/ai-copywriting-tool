import {
  AIError,
  callClaudeCli,
  type AIErrorType,
  type ClaudeCliRequest,
  type ClaudeCliResponse,
} from "@/lib/claude-cli"
import { callOpenClaw, OpenClawError } from "@/lib/openclaw"

export type AIProvider = "claude" | "openclaw"

export function getDefaultProvider(): AIProvider {
  const raw = (process.env.AI_PROVIDER || "claude").toLowerCase()
  return raw === "openclaw" ? "openclaw" : "claude"
}

// Kept for backwards-compat with prior code that imported it.
export const getActiveProvider = getDefaultProvider

export function resolveProvider(override?: AIProvider | null): AIProvider {
  if (override === "claude" || override === "openclaw") return override
  return getDefaultProvider()
}

export async function callAI(
  params: ClaudeCliRequest & { provider?: AIProvider }
): Promise<ClaudeCliResponse & { provider: AIProvider }> {
  const provider = resolveProvider(params.provider)
  const { provider: _ignored, ...rest } = params
  const result =
    provider === "openclaw" ? await callOpenClaw(rest) : await callClaudeCli(rest)
  return { ...result, provider }
}

export function getAIErrorType(error: unknown): AIErrorType | null {
  if (error instanceof AIError) return error.type
  if (error instanceof OpenClawError) return error.type
  return null
}
