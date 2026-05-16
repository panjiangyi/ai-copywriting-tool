import { NextResponse } from "next/server"
import { z } from "zod"
import {
  type AIProvider,
  type CopyVariant,
  type GeneratedCopy,
  type GeneratedCopySet,
  type GenerateRequest,
  generatedCopySchema,
  generatedCopySetSchema,
  generateRequestSchema,
} from "@/lib/ai-copy"
import { extractJsonBlock } from "@/lib/openclaw"
import { callAI, getAIErrorType } from "@/lib/ai-provider"
import { AIError } from "@/lib/claude-cli"

function buildSystemPrompt() {
  return [
    "你是一个中文高转化营销文案引擎。",
    "你的任务是基于用户提供的业务资料，输出适合获客转化场景的优化文案。",
    "你必须严格输出 JSON，不要输出 Markdown，不要解释，不要补充前后缀。",
    "JSON 结构必须为：",
    '{',
    '  "copies": [',
    "    {",
    '      "title": "文案标题",',
    '      "content": "完整文案正文",',
    '      "structure": {',
    '        "hook": "开头钩子类型",',
    '        "logic": "文案逻辑链路",',
    '        "sections": ["分段1", "分段2"]',
    "      },",
    '      "suggestions": ["建议1", "建议2"]',
    "    }",
    "  ],",
    '  "matchScore": 95',
    '}',
    "要求：",
    "1. copies 数量必须与用户要求一致，每个元素是一条完整文案。",
    "2. 每条 content 必须是可直接使用的中文营销文案，不要写说明文字。",
    "3. 每条 title 必须适合该条文案，不要只给标题列表。",
    "4. structure 要总结对应文案的结构，而不是重复原文。",
    "5. suggestions 给出对应文案的可执行优化建议。",
    "5. matchScore 返回 80-99 的整数，表示资料匹配度估计。",
  ].join("\n")
}

function buildUserPrompt(input: GenerateRequest) {
  return [
    `目标行业：${input.industry}`,
    `文案用途：${input.usage}`,
    `文案风格：${input.styles.join("、")}`,
    `目标字数：${input.wordCount}`,
    `需要生成文案数量：${input.count}`,
    "",
    "请基于以下行业文案资料，生成更专业、更有转化力的中文文案：",
    input.document,
  ].join("\n")
}

function buildRepairPrompt(input: GenerateRequest, rawContent: string) {
  return [
    "下面是一次 AI 文案生成的原始输出，但它不符合目标 JSON schema。",
    "请根据原始输出和用户需求，把它修复为严格 JSON。",
    "不要输出 Markdown，不要解释，只输出 JSON。",
    "",
    "目标 JSON 字段：copies[].title, copies[].content, copies[].structure.hook, copies[].structure.logic, copies[].structure.sections, copies[].suggestions, matchScore。",
    `copies 数量必须为：${input.count}`,
    `目标行业：${input.industry}`,
    `文案用途：${input.usage}`,
    `文案风格：${input.styles.join("、")}`,
    `目标字数：${input.wordCount}`,
    "",
    "用户原始资料：",
    input.document,
    "",
    "原始输出：",
    rawContent,
  ].join("\n")
}

function parseGeneratedCopy(rawContent: string) {
  try {
    const json = JSON.parse(extractJsonBlock(rawContent))
    const copySet = generatedCopySetSchema.safeParse(json)
    if (copySet.success) return normalizeGeneratedCopySet(copySet.data)

    const legacyCopy = generatedCopySchema.parse(json)
    return normalizeLegacyCopy(legacyCopy)
  } catch {
    return null
  }
}

async function parseOrRepairGeneratedCopy(
  input: GenerateRequest,
  rawContent: string,
  provider?: AIProvider
) {
  const parsed = parseGeneratedCopy(rawContent)
  if (parsed && parsed.copies.length >= input.count) {
    return normalizeGeneratedCopy(parsed, input.count)
  }

  const repaired = await callAI({
    systemPrompt: buildSystemPrompt(),
    userPrompt: buildRepairPrompt(input, rawContent),
    maxTokens: 1400,
    provider,
  })

  const repairedParsed = parseGeneratedCopy(repaired.content)
  if (repairedParsed && repairedParsed.copies.length >= input.count) {
    return normalizeGeneratedCopy(repairedParsed, input.count)
  }

  throw new AIError("AI returned invalid JSON after repair", "invalid_response")
}

function normalizeLegacyCopy(copy: GeneratedCopy): GeneratedCopySet {
  const titles = copy.titles.length > 0 ? copy.titles : [copy.title || "生成文案"]
  const copies = titles.map((title, index) => ({
    title,
    content: index === 0 ? copy.content : `${title}\n\n${copy.content}`,
    structure: copy.structure,
    suggestions: copy.suggestions,
  }))

  return {
    copies,
    matchScore: copy.matchScore,
  }
}

function normalizeGeneratedCopySet(copySet: GeneratedCopySet): GeneratedCopySet {
  return {
    ...copySet,
    copies: copySet.copies.map((copy, index) => ({
      ...copy,
      title: copy.title || `文案 ${index + 1}`,
    })),
  }
}

function normalizeGeneratedCopy(copySet: GeneratedCopySet, count: number): GeneratedCopySet {
  return {
    ...copySet,
    copies: copySet.copies.slice(0, count),
  }
}

function combineContent(copies: CopyVariant[]) {
  return copies
    .map((copy, index) => `文案 ${index + 1}：${copy.title}\n\n${copy.content}`)
    .join("\n\n---\n\n")
}

function combineSuggestions(copies: CopyVariant[]) {
  const suggestions = copies.flatMap((copy, index) =>
    copy.suggestions.map((suggestion) => `文案 ${index + 1}：${suggestion}`)
  )

  return suggestions.length > 0 ? suggestions : ["建议结合真实案例进一步增强信任感"]
}

function formatError(error: unknown) {
  if (error instanceof z.ZodError) {
    return {
      status: 400,
      message: error.issues[0]?.message || "请求参数不合法",
    }
  }

  const aiErrorType = getAIErrorType(error)
  if (aiErrorType) {
    if (aiErrorType === "auth") {
      return { status: 502, message: "AI 服务鉴权失败，请检查后端配置" }
    }
    if (aiErrorType === "rate_limit") {
      return { status: 429, message: "AI 服务繁忙，请稍后再试" }
    }
    if (aiErrorType === "network") {
      return { status: 502, message: "AI 服务连接失败，请检查 AI 后端配置" }
    }
    if (aiErrorType === "server") {
      return { status: 502, message: "AI 服务暂时不可用，请稍后再试" }
    }
    if (aiErrorType === "invalid_response") {
      return { status: 502, message: "AI 返回格式异常，请稍后再试" }
    }
    if (aiErrorType === "config") {
      return { status: 500, message: "AI 服务配置缺失，请检查环境变量" }
    }
  }

  return { status: 500, message: "生成失败，请稍后重试" }
}

export async function POST(request: Request) {
  try {
    const body = generateRequestSchema.parse(await request.json())
    const startedAt = Date.now()

    const response = await callAI({
      systemPrompt: buildSystemPrompt(),
      userPrompt: buildUserPrompt(body),
      provider: body.provider,
    })

    const parsed = await parseOrRepairGeneratedCopy(body, response.content, response.provider)
    const titles = parsed.copies.map((copy) => copy.title)
    const content = combineContent(parsed.copies)
    const totalWords = parsed.copies.reduce(
      (sum, copy) => sum + copy.content.replace(/\s+/g, "").length,
      0
    )
    const duration = Number(((Date.now() - startedAt) / 1000).toFixed(1))
    const primaryCopy = parsed.copies[0]

    return NextResponse.json({
      requestId: `copy_${Date.now()}`,
      matchScore: parsed.matchScore ?? 95,
      totalWords,
      titleCount: titles.length,
      duration,
      titles,
      content,
      structure: primaryCopy.structure,
      suggestions: combineSuggestions(parsed.copies),
      copies: parsed.copies,
      usage: response.usage,
      provider: response.provider,
    })
  } catch (error) {
    console.error("[api/generate]", error)
    const formatted = formatError(error)
    return NextResponse.json({ error: formatted.message }, { status: formatted.status })
  }
}
