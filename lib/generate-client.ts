import { type GenerateRequest, type GenerateResponse, generateResponseSchema } from "@/lib/ai-copy"

export async function generateCopy(input: GenerateRequest): Promise<GenerateResponse> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  })

  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || "AI 服务暂时繁忙，请稍后再试")
  }

  const parsed = generateResponseSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error("AI 返回格式异常，请稍后再试")
  }

  return parsed.data
}
