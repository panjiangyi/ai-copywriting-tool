"use client"

import { useEffect, useState } from "react"
import { Target, FileText, Heading, Clock, Cpu } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AIProvider } from "@/lib/ai-copy"

interface MetricsPanelProps {
  matchScore: number
  totalWords: number
  titleCount: number
  duration: number
  provider?: AIProvider
}

const providerLabel: Record<AIProvider, string> = {
  claude: "Claude Code",
  openclaw: "OpenClaw",
}

function AnimatedNumber({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1500
    const startTime = Date.now()
    const startValue = 0

    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (value - startValue) * eased
      
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value])

  return (
    <span className="font-mono tabular-nums">
      {decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue)}
      {suffix}
    </span>
  )
}

const metrics = [
  {
    key: "matchScore",
    icon: Target,
    label: "结构匹配度",
    suffix: "%",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20"
  },
  {
    key: "totalWords",
    icon: FileText,
    label: "总字数",
    suffix: " 字",
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/20"
  },
  {
    key: "titleCount",
    icon: Heading,
    label: "备选标题",
    suffix: " 条",
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/20"
  },
  {
    key: "duration",
    icon: Clock,
    label: "生成耗时",
    suffix: " 秒",
    decimals: 1,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
    borderColor: "border-chart-4/20"
  },
]

export function MetricsPanel({ matchScore, totalWords, titleCount, duration, provider }: MetricsPanelProps) {
  const values: Record<string, number> = { matchScore, totalWords, titleCount, duration }

  return (
    <div className="space-y-3">
      {provider && (
        <div className="flex justify-end">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
            <Cpu className="w-3 h-3" />
            本次由 {providerLabel[provider]} 生成
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <div
            key={metric.key}
            className={cn(
              "glass-card rounded-xl p-4 animate-count-up border",
              metric.borderColor
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("p-2 rounded-lg", metric.bgColor)}>
                <Icon className={cn("w-4 h-4", metric.color)} />
              </div>
              <span className="text-sm text-muted-foreground">{metric.label}</span>
            </div>
            <div className={cn("text-3xl font-bold", metric.color)}>
              <AnimatedNumber
                value={values[metric.key]}
                suffix={metric.suffix}
                decimals={metric.decimals || 0}
              />
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}
