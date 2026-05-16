import { NextResponse } from "next/server"
import { callOpenClaw, getOpenClawConfig, OpenClawError } from "@/lib/openclaw"

export async function GET() {
  let config: ReturnType<typeof getOpenClawConfig>

  try {
    config = getOpenClawConfig()
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errorType: "config",
        message: error instanceof Error ? error.message : "OpenClaw config is invalid",
      },
      { status: 500 }
    )
  }

  try {
    await callOpenClaw({
      systemPrompt: "你是健康检查接口。只回复 JSON。",
      userPrompt: '请只返回 {"ok":true}',
      maxTokens: 50,
    })

    return NextResponse.json({
      ok: true,
      baseUrl: config.baseUrl,
      model: config.model,
    })
  } catch (error) {
    const errorType = error instanceof OpenClawError ? error.type : "unknown"
    const status = error instanceof OpenClawError && error.type === "auth" ? 502 : 500

    return NextResponse.json(
      {
        ok: false,
        baseUrl: config.baseUrl,
        model: config.model,
        errorType,
        message: error instanceof Error ? error.message : "OpenClaw health check failed",
      },
      { status }
    )
  }
}
