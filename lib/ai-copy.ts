import { z } from "zod"

export const generateRequestSchema = z.object({
  document: z.string().min(30, "请输入至少30字的行业文案撰写文档"),
  industry: z.string().min(1, "请选择目标行业"),
  usage: z.string().min(1, "请选择文案用途"),
  styles: z.array(z.string()).min(1, "请至少选择一种文案风格"),
  wordCount: z.string().min(1, "请选择字数范围"),
  count: z.number().int().min(1).max(3),
})

export const generatedCopySchema = z.object({
  title: z.string().min(1).optional(),
  titles: z.array(z.string()).min(1),
  content: z.string().min(1),
  structure: z.object({
    hook: z.string().min(1),
    logic: z.string().min(1),
    sections: z.array(z.string()).min(1),
  }),
  suggestions: z.array(z.string()).min(1),
  matchScore: z.number().min(0).max(100).optional(),
})

export const copyVariantSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  structure: z.object({
    hook: z.string().min(1),
    logic: z.string().min(1),
    sections: z.array(z.string()).min(1),
  }),
  suggestions: z.array(z.string()).min(1),
})

export const generatedCopySetSchema = z.object({
  copies: z.array(copyVariantSchema).min(1),
  matchScore: z.number().min(0).max(100).optional(),
})

export const generateResponseSchema = generatedCopySchema.extend({
  requestId: z.string(),
  matchScore: z.number().min(0).max(100),
  totalWords: z.number().int().min(0),
  titleCount: z.number().int().min(0),
  duration: z.number().min(0),
  copies: z.array(copyVariantSchema).min(1),
})

export type GenerateRequest = z.infer<typeof generateRequestSchema>
export type GeneratedCopy = z.infer<typeof generatedCopySchema>
export type CopyVariant = z.infer<typeof copyVariantSchema>
export type GeneratedCopySet = z.infer<typeof generatedCopySetSchema>
export type GenerateResponse = z.infer<typeof generateResponseSchema>
export type GenerateState = "idle" | "editing" | "loading" | "success" | "error"
