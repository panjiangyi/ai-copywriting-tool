import { z } from "zod"

export type OpenClawErrorType = "auth" | "rate_limit" | "server" | "network" | "config" | "invalid_response"

export class OpenClawError extends Error {
  type: OpenClawErrorType
  status?: number

  constructor(message: string, type: OpenClawErrorType, status?: number) {
    super(message)
    this.name = "OpenClawError"
    this.type = type
    this.status = status
  }
}

const responseSchema = z.object({
  id: z.string().optional(),
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string().nullable().optional(),
      }),
    })
  ).min(1),
  usage: z.object({
    prompt_tokens: z.number().optional(),
    completion_tokens: z.number().optional(),
    total_tokens: z.number().optional(),
  }).optional(),
})

export interface OpenClawRequest {
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
}

export interface OpenClawResponse {
  content: string
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new OpenClawError(`Missing required environment variable: ${name}`, "config")
  }

  return value
}

export function getOpenClawConfig() {
  return {
    baseUrl: getRequiredEnv("OPENCLAW_BASE_URL").replace(/\/$/, ""),
    token: getRequiredEnv("OPENCLAW_API_TOKEN"),
    model: process.env.OPENCLAW_MODEL || "openclaw:json-agent",
  }
}

function mapStatusToErrorType(status: number): OpenClawErrorType {
  if (status === 401 || status === 403) return "auth"
  if (status === 429) return "rate_limit"
  if (status >= 500) return "server"
  return "invalid_response"
}

export async function callOpenClaw({
  systemPrompt,
  userPrompt,
  maxTokens = 1400,
}: OpenClawRequest): Promise<OpenClawResponse> {
  const { baseUrl, token, model } = getOpenClawConfig()

  let response: Response

  try {
    response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      cache: "no-store",
    })
  } catch (error) {
    throw new OpenClawError(
      error instanceof Error ? error.message : "OpenClaw network request failed",
      "network"
    )
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new OpenClawError(
      `OpenClaw request failed (${response.status}): ${errorText}`,
      mapStatusToErrorType(response.status),
      response.status
    )
  }

  let responseJson: unknown

  try {
    responseJson = await response.json()
  } catch {
    throw new OpenClawError("OpenClaw response is not valid JSON", "invalid_response")
  }

  const json = responseSchema.safeParse(responseJson)

  if (!json.success) {
    throw new OpenClawError("OpenClaw response shape is invalid", "invalid_response")
  }

  const content = json.data.choices[0]?.message?.content?.trim()

  if (!content) {
    throw new OpenClawError("OpenClaw response did not include message content", "invalid_response")
  }

  return {
    content,
    usage: json.data.usage
      ? {
          promptTokens: json.data.usage.prompt_tokens,
          completionTokens: json.data.usage.completion_tokens,
          totalTokens: json.data.usage.total_tokens,
        }
      : undefined,
  }
}

export function extractJsonBlock(content: string): string {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    return fenced[1].trim()
  }

  const firstBrace = content.indexOf("{")
  const lastBrace = content.lastIndexOf("}")

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return content.slice(firstBrace, lastBrace + 1)
  }

  return content
}
