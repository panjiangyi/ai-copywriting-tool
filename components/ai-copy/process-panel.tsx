"use client"

import { useEffect, useState } from "react"
import { FileSearch, Layers, Building2, Sparkles, ShieldCheck, Check, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
  { icon: FileSearch, label: "文档解析", description: "正在读取行业文档，提取业务信息" },
  { icon: Layers, label: "结构拆解", description: "正在拆解痛点、卖点和成交结构" },
  { icon: Building2, label: "行业适配", description: "正在匹配行业表达和客户心理" },
  { icon: Sparkles, label: "生成文案", description: "正在生成正文、标题和口播节奏" },
  { icon: ShieldCheck, label: "质量校验", description: "正在检测可读性、转化力和结构完整度" },
]

const logMessages = [
  "正在读取行业文案撰写文档……",
  "正在识别核心业务关键词……",
  "正在提取目标客户画像……",
  "正在定位客户高频痛点……",
  "正在分析文案开头钩子……",
  "正在拆解成交逻辑链路……",
  "正在匹配行业专业术语……",
  "正在生成短视频口播节奏……",
  "正在生成高点击标题……",
  "正在优化文案转化表达……",
  "正在校验内容完整度……",
  "正在输出最终结果……",
]

interface ProcessPanelProps {
  currentStep: number
  progress: number
  isComplete: boolean
  isError: boolean
}

export function ProcessPanel({ currentStep, progress, isComplete, isError }: ProcessPanelProps) {
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    if (!isComplete && !isError && currentStep === 0 && progress === 0) {
      setLogs([logMessages[0]])
    }
  }, [currentStep, progress, isComplete, isError])

  useEffect(() => {
    if (isComplete || isError) return

    const interval = setInterval(() => {
      setLogs(prev => {
        if (prev.length >= logMessages.length) return prev
        const nextIndex = prev.length
        return [...prev, logMessages[nextIndex]]
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [isComplete, isError])

  useEffect(() => {
    if (isComplete) {
      setLogs(logMessages)
    }
  }, [isComplete])

  return (
    <div className="glass-card rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI 分析进度
        </h3>
        <span className="font-mono text-sm text-primary">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 progress-gradient rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
        {!isComplete && !isError && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        )}
      </div>

      {/* Steps */}
      <div className="grid grid-cols-5 gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = index === currentStep && !isComplete && !isError
          const isDone = index < currentStep || isComplete
          const isFailed = isError && index === currentStep

          return (
            <div
              key={step.label}
              className={cn(
                "relative flex flex-col items-center text-center p-3 rounded-lg transition-all",
                isActive && "bg-primary/10",
                isDone && "bg-primary/5",
                isFailed && "bg-destructive/10"
              )}
            >
              {/* Step indicator */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all",
                  isActive && "bg-primary/20 animate-pulse-glow",
                  isDone && "bg-primary/20",
                  isFailed && "bg-destructive/20",
                  !isActive && !isDone && !isFailed && "bg-secondary"
                )}
              >
                {isDone ? (
                  <Check className="w-5 h-5 text-primary" />
                ) : isFailed ? (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <Icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                )}
              </div>

              {/* Step label */}
              <span className={cn(
                "text-xs font-medium",
                isActive || isDone ? "text-foreground" : "text-muted-foreground",
                isFailed && "text-destructive"
              )}>
                {step.label}
              </span>

              {/* Connection line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-8 -right-1 w-2 h-0.5",
                    isDone ? "bg-primary/50" : "bg-border"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Current Step Description */}
      {!isComplete && !isError && currentStep < steps.length && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {steps[currentStep]?.description}
          </p>
        </div>
      )}

      {/* Log Console */}
      <div className="bg-secondary/50 rounded-lg p-4 h-32 overflow-y-auto font-mono text-xs space-y-1">
        {logs.map((log, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2",
              index === logs.length - 1 && !isComplete ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span className="text-primary/50">[{String(index + 1).padStart(2, "0")}]</span>
            <span>{log}</span>
            {index === logs.length - 1 && !isComplete && (
              <span className="animate-pulse">▌</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
