"use client"

import { memo, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Zap, AlertCircle, FileText } from "lucide-react"
import type { GenerateRequest } from "@/lib/ai-copy"

type SectionKey =
  | "business"
  | "customer"
  | "painPoints"
  | "advantages"
  | "scripts"
  | "direction"
  | "notes"

interface SectionConfig {
  key: SectionKey
  label: string
  placeholder: string
  rows: number
  fullWidth?: boolean
}

const sections: SectionConfig[] = [
  {
    key: "business",
    label: "业务介绍",
    placeholder: "例：我是做装修设计的，主要服务准备装修新房的业主。",
    rows: 3,
  },
  {
    key: "customer",
    label: "目标客户",
    placeholder: "例：预算 30-50 万、首次装修的城市白领业主。",
    rows: 3,
  },
  {
    key: "painPoints",
    label: "客户痛点",
    placeholder: "例：预算超支、防水电路做不好、入住后问题多。",
    rows: 3,
  },
  {
    key: "advantages",
    label: "产品/服务优势",
    placeholder: "例：施工透明、材料可查、工地全程巡检。",
    rows: 3,
  },
  {
    key: "scripts",
    label: "成交话术或案例",
    placeholder: "例：上周一个客户因为我们的全程巡检，避免了 3 万的返工损失。",
    rows: 3,
  },
  {
    key: "direction",
    label: "希望生成的文案方向",
    placeholder: "例：适合抖音口播的获客文案，强调专业感与信任感。",
    rows: 3,
  },
  {
    key: "notes",
    label: "补充信息（可选）",
    placeholder: "其他想让 AI 知道的内容，比如品牌口号、禁用词、参考样稿等。",
    rows: 5,
    fullWidth: true,
  },
]

type SectionState = Record<SectionKey, string>

const emptySections: SectionState = {
  business: "",
  customer: "",
  painPoints: "",
  advantages: "",
  scripts: "",
  direction: "",
  notes: "",
}

function assembleDocument(state: SectionState): string {
  return sections
    .map((section) => {
      const value = state[section.key].trim()
      if (!value) return null
      const label = section.key === "notes" ? "补充信息" : section.label
      return `【${label}】${value}`
    })
    .filter(Boolean)
    .join("\n\n")
}

const DRAFTS_STORAGE_KEY = "ai-copy:drafts"

interface DraftSlot {
  sections: SectionState
  styles: string[]
  wordCount: string
  count: number
}

type DraftsMap = Record<string, DraftSlot>

function getSlotKey(industry: string, usage: string) {
  return `${industry}|${usage}`
}

function readDrafts(): DraftsMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(DRAFTS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? (parsed as DraftsMap) : {}
  } catch {
    return {}
  }
}

function writeDrafts(drafts: DraftsMap) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts))
  } catch {
    // quota exceeded or unavailable — silently skip
  }
}

function sanitizeSlot(raw: unknown): DraftSlot {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const sec =
    obj.sections && typeof obj.sections === "object"
      ? (obj.sections as Record<string, unknown>)
      : {}
  const pickStr = (k: string) => (typeof sec[k] === "string" ? (sec[k] as string) : "")
  const rawCount = obj.count
  const validCount =
    typeof rawCount === "number" && Number.isInteger(rawCount) && rawCount >= 1 && rawCount <= 3
      ? rawCount
      : 1
  return {
    sections: {
      business: pickStr("business"),
      customer: pickStr("customer"),
      painPoints: pickStr("painPoints"),
      advantages: pickStr("advantages"),
      scripts: pickStr("scripts"),
      direction: pickStr("direction"),
      notes: pickStr("notes"),
    },
    styles: Array.isArray(obj.styles)
      ? (obj.styles as unknown[]).filter((s): s is string => typeof s === "string")
      : [],
    wordCount: typeof obj.wordCount === "string" ? obj.wordCount : "",
    count: validCount,
  }
}

const industries = [
  "体彩店店主", "装修设计", "口腔牙科", "美容美业", "教育培训", "法律咨询",
  "房产中介", "招商加盟", "家政服务", "企业服务", "本地生活",
  "电商带货", "知识付费", "医疗健康", "汽车服务", "财税服务", "其他行业"
]

const usages = [
  "短视频口播", "小红书笔记", "朋友圈文案", "社群转化文案",
  "直播话术", "私信回复", "广告落地页", "招商文案", "销售话术"
]

const styles = [
  "专业", "犀利", "温暖", "口语化", "故事型", "干货型",
  "成交导向", "老板人设", "专家人设", "避坑型", "焦虑型", "信任型"
]

const wordCounts = [
  "200 字以内", "400 字左右", "600 字左右", "800 字左右", "1000 字左右"
]

const counts = [1, 2, 3]

// --- Memoed subcomponents ---
// React.memo skips re-render when props are referentially equal.
// We pass setSectionState / setFormData directly (useState setters are stable refs).

interface SectionFieldProps {
  config: SectionConfig
  value: string
  setSectionState: Dispatch<SetStateAction<SectionState>>
  disabled: boolean
}

const SectionField = memo(function SectionField({
  config,
  value,
  setSectionState,
  disabled,
}: SectionFieldProps) {
  return (
    <div className={`space-y-2 ${config.fullWidth ? "md:col-span-2" : ""}`}>
      <Label htmlFor={`section-${config.key}`} className="text-foreground text-sm">
        {config.label}
      </Label>
      <Textarea
        id={`section-${config.key}`}
        rows={config.rows}
        value={value}
        onChange={(e) =>
          setSectionState((prev) => ({ ...prev, [config.key]: e.target.value }))
        }
        placeholder={config.placeholder}
        disabled={disabled}
        className="bg-secondary border-border focus:border-primary focus:ring-primary/20 resize-none text-foreground placeholder:text-muted-foreground"
      />
    </div>
  )
})

interface StyleTagsProps {
  selected: string[]
  setFormData: Dispatch<SetStateAction<GenerateRequest>>
  disabled: boolean
}

const StyleTags = memo(function StyleTags({ selected, setFormData, disabled }: StyleTagsProps) {
  const toggle = (style: string) => {
    setFormData((prev) => ({
      ...prev,
      styles: prev.styles.includes(style)
        ? prev.styles.filter((s) => s !== style)
        : [...prev.styles, style],
    }))
  }
  return (
    <div className="space-y-2">
      <Label className="text-foreground">文案风格（可多选）</Label>
      <div className="flex flex-wrap gap-2">
        {styles.map((style) => {
          const isSelected = selected.includes(style)
          return (
            <button
              key={style}
              type="button"
              onClick={() => toggle(style)}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground glow-green-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {style}
            </button>
          )
        })}
      </div>
    </div>
  )
})

interface ConfigSelectsProps {
  industry: string
  usage: string
  wordCount: string
  count: number
  setFormData: Dispatch<SetStateAction<GenerateRequest>>
  disabled: boolean
}

const ConfigSelects = memo(function ConfigSelects({
  industry,
  usage,
  wordCount,
  count,
  setFormData,
  disabled,
}: ConfigSelectsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label className="text-foreground">目标行业</Label>
        <Select
          value={industry}
          onValueChange={(v) => setFormData((p) => ({ ...p, industry: v }))}
          disabled={disabled}
        >
          <SelectTrigger className="bg-secondary border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {industries.map((it) => (
              <SelectItem key={it} value={it} className="text-foreground">
                {it}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">文案用途</Label>
        <Select
          value={usage}
          onValueChange={(v) => setFormData((p) => ({ ...p, usage: v }))}
          disabled={disabled}
        >
          <SelectTrigger className="bg-secondary border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {usages.map((u) => (
              <SelectItem key={u} value={u} className="text-foreground">
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">字数范围</Label>
        <Select
          value={wordCount}
          onValueChange={(v) => setFormData((p) => ({ ...p, wordCount: v }))}
          disabled={disabled}
        >
          <SelectTrigger className="bg-secondary border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {wordCounts.map((wc) => (
              <SelectItem key={wc} value={wc} className="text-foreground">
                {wc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">生成数量</Label>
        <Select
          value={String(count)}
          onValueChange={(v) => setFormData((p) => ({ ...p, count: Number(v) }))}
          disabled={disabled}
        >
          <SelectTrigger className="bg-secondary border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {counts.map((c) => (
              <SelectItem key={c} value={String(c)} className="text-foreground">
                {c} 条
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
})

interface InputPanelProps {
  formData: GenerateRequest
  setFormData: Dispatch<SetStateAction<GenerateRequest>>
  onGenerate: (document: string) => void
  isLoading: boolean
  error: string | null
}

export function InputPanel({
  formData,
  setFormData,
  onGenerate,
  isLoading,
  error
}: InputPanelProps) {
  const [sectionState, setSectionState] = useState<SectionState>(emptySections)
  const hydratingRef = useRef(true)
  const slotKey = getSlotKey(formData.industry, formData.usage)

  // Load draft for the current industry × usage slot (and whenever it switches).
  useEffect(() => {
    const drafts = readDrafts()
    const raw = drafts[slotKey]
    hydratingRef.current = true
    if (raw) {
      const slot = sanitizeSlot(raw)
      setSectionState(slot.sections)
      setFormData((prev) => ({
        ...prev,
        styles: slot.styles.length > 0 ? slot.styles : prev.styles,
        wordCount: slot.wordCount || prev.wordCount,
        count: slot.count,
      }))
    } else {
      setSectionState(emptySections)
    }
    const id = window.setTimeout(() => {
      hydratingRef.current = false
    }, 0)
    return () => window.clearTimeout(id)
  }, [slotKey, setFormData])

  // Persist on change (debounced) — skipped while hydrating.
  useEffect(() => {
    if (hydratingRef.current) return
    const id = window.setTimeout(() => {
      const drafts = readDrafts()
      drafts[slotKey] = {
        sections: sectionState,
        styles: formData.styles,
        wordCount: formData.wordCount,
        count: formData.count,
      }
      writeDrafts(drafts)
    }, 400)
    return () => window.clearTimeout(id)
  }, [sectionState, formData.styles, formData.wordCount, formData.count, slotKey])

  const assembledDocument = useMemo(() => assembleDocument(sectionState), [sectionState])
  const charCount = assembledDocument.length
  const isValid = charCount >= 30

  const handleGenerate = () => {
    onGenerate(assembledDocument)
  }

  return (
    <div className="glass-card rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">文案生成配置</h3>
      </div>

      {/* Structured Document Sections */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-baseline gap-2 flex-wrap">
            <Label className="text-foreground">
              行业文案撰写文档 <span className="text-destructive">*</span>
            </Label>
            <span className="text-xs text-muted-foreground">
              按「行业 × 用途」自动保存草稿
            </span>
          </div>
          <span className={`text-sm ${charCount < 30 ? "text-warning" : "text-muted-foreground"}`}>
            {charCount < 30 && "至少输入 30 字 · "}
            已输入 {charCount} 字
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section) => (
            <SectionField
              key={section.key}
              config={section}
              value={sectionState[section.key]}
              setSectionState={setSectionState}
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      <ConfigSelects
        industry={formData.industry}
        usage={formData.usage}
        wordCount={formData.wordCount}
        count={formData.count}
        setFormData={setFormData}
        disabled={isLoading}
      />

      <StyleTags selected={formData.styles} setFormData={setFormData} disabled={isLoading} />

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!isValid || isLoading}
        className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground glow-green transition-all disabled:opacity-50 disabled:glow-none"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
            AI 引擎分析中…
          </>
        ) : (
          <>
            <Zap className="w-5 h-5 mr-2" />
            启动 AI 生成引擎
          </>
        )}
      </Button>
    </div>
  )
}
