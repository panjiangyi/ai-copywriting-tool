"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Header } from "@/components/ai-copy/header"
import { HeroSection } from "@/components/ai-copy/hero-section"
import { InputPanel } from "@/components/ai-copy/input-panel"
import { ProcessPanel } from "@/components/ai-copy/process-panel"
import { MetricsPanel } from "@/components/ai-copy/metrics-panel"
import { ResultPanel } from "@/components/ai-copy/result-panel"
import { generateCopy } from "@/lib/generate-client"
import type { AIProvider, GenerateRequest, GenerateResponse, GenerateState } from "@/lib/ai-copy"

const PROVIDER_STORAGE_KEY = "ai-copy:provider"
const DEFAULT_PROVIDER: AIProvider = "claude"

const EXPECTED_MS_BY_PROVIDER: Record<AIProvider, number> = {
  openclaw: 60_000,
  claude: 25_000,
}

function getLoadingProgress(elapsedMs: number, expectedMs: number) {
  const scale = expectedMs / 60_000
  const checkpoints = [
    { time: 0, progress: 3 },
    { time: 8_000 * scale, progress: 16 },
    { time: 18_000 * scale, progress: 36 },
    { time: 32_000 * scale, progress: 58 },
    { time: 52_000 * scale, progress: 88 },
    { time: expectedMs, progress: 97 },
  ]

  for (let index = 1; index < checkpoints.length; index++) {
    const previous = checkpoints[index - 1]
    const next = checkpoints[index]

    if (elapsedMs <= next.time) {
      const segmentProgress = (elapsedMs - previous.time) / (next.time - previous.time)
      return previous.progress + (next.progress - previous.progress) * segmentProgress
    }
  }

  const overtimeMs = elapsedMs - expectedMs
  return Math.min(98.5, 97 + overtimeMs / (expectedMs / 2))
}

function getLoadingStep(elapsedMs: number, expectedMs: number) {
  const scale = expectedMs / 60_000
  if (elapsedMs < 8_000 * scale) return 0
  if (elapsedMs < 18_000 * scale) return 1
  if (elapsedMs < 32_000 * scale) return 2
  if (elapsedMs < 52_000 * scale) return 3
  return 4
}

export default function Home() {
  const [state, setState] = useState<GenerateState>("idle")
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [provider, setProvider] = useState<AIProvider>(DEFAULT_PROVIDER)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(PROVIDER_STORAGE_KEY)
    if (stored === "claude" || stored === "openclaw") {
      setProvider(stored)
    }
  }, [])

  const handleProviderChange = useCallback((next: AIProvider) => {
    setProvider(next)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PROVIDER_STORAGE_KEY, next)
    }
  }, [])

  const [formData, setFormData] = useState<GenerateRequest>({
    document: "",
    industry: "体彩店店主",
    usage: "短视频口播",
    styles: ["专业", "成交导向", "口语化"],
    wordCount: "400 字左右",
    count: 1
  })
  const lastDocumentRef = useRef("")

  const handleGenerate = useCallback(async (document: string) => {
    if (document.length < 30) {
      setError("请输入至少30字的行业文案撰写文档")
      return
    }
    lastDocumentRef.current = document

    setState("loading")
    setError(null)
    setCurrentStep(0)
    setProgress(0)
    setResult(null)

    const startedAt = Date.now()
    const expectedMs = EXPECTED_MS_BY_PROVIDER[provider]
    const progressTimer = setInterval(() => {
      const elapsedMs = Date.now() - startedAt
      setCurrentStep(getLoadingStep(elapsedMs, expectedMs))
      setProgress(getLoadingProgress(elapsedMs, expectedMs))
    }, 250)

    try {
      const response = await generateCopy({ ...formData, document, provider })
      clearInterval(progressTimer)
      setCurrentStep(5)
      setProgress(100)
      setResult(response)
      setState("success")
    } catch (err) {
      clearInterval(progressTimer)
      setError(err instanceof Error ? err.message : "AI 服务暂时繁忙，请稍后再试")
      setState("error")
    }
  }, [formData, provider])

  const handleRegenerate = useCallback(() => {
    handleGenerate(lastDocumentRef.current)
  }, [handleGenerate])

  return (
    <main className="min-h-screen">
      <Header
        provider={provider}
        onProviderChange={handleProviderChange}
        disabled={state === "loading"}
      />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <HeroSection />

        <InputPanel
          formData={formData}
          setFormData={setFormData}
          onGenerate={handleGenerate}
          isLoading={state === "loading"}
          error={error}
        />

        {(state === "loading" || state === "success" || state === "error") && (
          <ProcessPanel
            currentStep={currentStep}
            progress={progress}
            isComplete={state === "success"}
            isError={state === "error"}
          />
        )}

        {state === "success" && result && (
          <>
            <MetricsPanel
              matchScore={result.matchScore}
              totalWords={result.totalWords}
              titleCount={result.titleCount}
              duration={result.duration}
              provider={result.provider}
            />
            <ResultPanel
              result={result}
              onRegenerate={handleRegenerate}
            />
          </>
        )}
      </div>
    </main>
  )
}
