import { NextResponse } from "next/server"
import { AIError, callClaudeCli } from "@/lib/claude-cli"

export async function GET() {
  const binPath = process.env.CLAUDE_BIN_PATH || "claude"

  try {
    const response = await callClaudeCli({
      systemPrompt: "你是健康检查接口。只回复 JSON。",
      userPrompt: '请只返回 {"ok":true}',
    })

    return NextResponse.json({
      ok: true,
      provider: "claude",
      binPath,
      sample: response.content.slice(0, 80),
      usage: response.usage,
    })
  } catch (error) {
    const errorType = error instanceof AIError ? error.type : "unknown"
    const status = error instanceof AIError && error.type === "auth" ? 502 : 500

    return NextResponse.json(
      {
        ok: false,
        provider: "claude",
        binPath,
        errorType,
        message: error instanceof Error ? error.message : "claude CLI health check failed",
      },
      { status }
    )
  }
}
