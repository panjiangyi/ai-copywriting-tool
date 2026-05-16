"use client"

import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
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

interface InputPanelProps {
  formData: GenerateRequest
  setFormData: Dispatch<SetStateAction<GenerateRequest>>
  onGenerate: () => void
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

  useEffect(() => {
    const assembled = assembleDocument(sectionState)
    setFormData((prev) => (prev.document === assembled ? prev : { ...prev, document: assembled }))
  }, [sectionState, setFormData])

  const charCount = formData.document.length
  const isValid = charCount >= 30

  const updateSection = (key: SectionKey, value: string) => {
    setSectionState((prev) => ({ ...prev, [key]: value }))
  }

  const toggleStyle = (style: string) => {
    setFormData(prev => ({
      ...prev,
      styles: prev.styles.includes(style)
        ? prev.styles.filter(s => s !== style)
        : [...prev.styles, style]
    }))
  }

  return (
    <div className="glass-card rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">文案生成配置</h3>
      </div>

      {/* Structured Document Sections */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-foreground">
            行业文案撰写文档 <span className="text-destructive">*</span>
          </Label>
          <span className={`text-sm ${charCount < 30 ? "text-warning" : "text-muted-foreground"}`}>
            {charCount < 30 && "至少输入 30 字 · "}
            已输入 {charCount} 字
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section) => (
            <div
              key={section.key}
              className={`space-y-2 ${section.fullWidth ? "md:col-span-2" : ""}`}
            >
              <Label htmlFor={`section-${section.key}`} className="text-foreground text-sm">
                {section.label}
              </Label>
              <Textarea
                id={`section-${section.key}`}
                rows={section.rows}
                value={sectionState[section.key]}
                onChange={(e) => updateSection(section.key, e.target.value)}
                placeholder={section.placeholder}
                disabled={isLoading}
                className="bg-secondary border-border focus:border-primary focus:ring-primary/20 resize-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Select Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Industry */}
        <div className="space-y-2">
          <Label className="text-foreground">目标行业</Label>
          <Select
            value={formData.industry}
            onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
            disabled={isLoading}
          >
            <SelectTrigger className="bg-secondary border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {industries.map(industry => (
                <SelectItem key={industry} value={industry} className="text-foreground">
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Usage */}
        <div className="space-y-2">
          <Label className="text-foreground">文案用途</Label>
          <Select
            value={formData.usage}
            onValueChange={(value) => setFormData(prev => ({ ...prev, usage: value }))}
            disabled={isLoading}
          >
            <SelectTrigger className="bg-secondary border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {usages.map(usage => (
                <SelectItem key={usage} value={usage} className="text-foreground">
                  {usage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Word Count */}
        <div className="space-y-2">
          <Label className="text-foreground">字数范围</Label>
          <Select
            value={formData.wordCount}
            onValueChange={(value) => setFormData(prev => ({ ...prev, wordCount: value }))}
            disabled={isLoading}
          >
            <SelectTrigger className="bg-secondary border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {wordCounts.map(wc => (
                <SelectItem key={wc} value={wc} className="text-foreground">
                  {wc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Count */}
        <div className="space-y-2">
          <Label className="text-foreground">生成数量</Label>
          <Select
            value={String(formData.count)}
            onValueChange={(value) => setFormData(prev => ({ ...prev, count: Number(value) }))}
            disabled={isLoading}
          >
            <SelectTrigger className="bg-secondary border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {counts.map(c => (
                <SelectItem key={c} value={String(c)} className="text-foreground">
                  {c} 条
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Style Tags */}
      <div className="space-y-2">
        <Label className="text-foreground">文案风格（可多选）</Label>
        <div className="flex flex-wrap gap-2">
          {styles.map(style => {
            const isSelected = formData.styles.includes(style)
            return (
              <button
                key={style}
                type="button"
                onClick={() => toggleStyle(style)}
                disabled={isLoading}
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

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={onGenerate}
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
