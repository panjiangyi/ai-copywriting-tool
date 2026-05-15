"use client"

import { useState, useCallback } from "react"
import { Header } from "@/components/ai-copy/header"
import { HeroSection } from "@/components/ai-copy/hero-section"
import { InputPanel } from "@/components/ai-copy/input-panel"
import { ProcessPanel } from "@/components/ai-copy/process-panel"
import { MetricsPanel } from "@/components/ai-copy/metrics-panel"
import { ResultPanel } from "@/components/ai-copy/result-panel"

export type GenerateState = "idle" | "editing" | "loading" | "success" | "error"

export interface GenerateResult {
  requestId: string
  matchScore: number
  totalWords: number
  titleCount: number
  duration: number
  titles: string[]
  content: string
  structure: {
    hook: string
    logic: string
    sections: string[]
  }
  suggestions: string[]
}

export interface FormData {
  document: string
  industry: string
  usage: string
  styles: string[]
  wordCount: string
  count: number
}

// Mock API response for demo
const mockGenerateResponse = async (formData: FormData): Promise<GenerateResult> => {
  await new Promise(resolve => setTimeout(resolve, 8000))
  
  return {
    requestId: `copy_${Date.now()}`,
    matchScore: 97,
    totalWords: 430,
    titleCount: 5,
    duration: 8.6,
    titles: [
      "装修花了钱还糟心？问题通常出在这里",
      "真正懂装修的人，都会把钱花在看不见的地方",
      "新房装修，这3个地方千万别省",
      "装修最怕的不是贵，而是这些地方没做好",
      "住进去才后悔的装修坑，很多人一开始就错了"
    ],
    content: `是不是装修花了不少钱，住进去却全是糟心事？

装修不是哪里好看就往哪砸，而是要把钱花在你看不见的地方。

很多人装修的时候，总想着瓷砖要好看、柜子要漂亮、灯具要高端。结果住进去才发现：

水管漏水、电路跳闸、防水没做好楼下邻居天天来敲门……

这些才是装修最该花钱的地方：

第一，水电工程。
水电是装修的生命线，一旦出问题，砸墙重做，花的钱是当初的三倍不止。

第二，防水处理。
卫生间、厨房、阳台，这些地方防水没做好，楼下漏水你赔钱，自己家墙面发霉脱皮。

第三，隐蔽工程验收。
每一个施工节点都要有人把关，否则等贴了砖、刷了漆，再想改就晚了。

我们做了12年装修，最清楚哪些地方能省、哪些地方绝对不能省。

全程透明报价，材料可查可验，工地巡检到位。

装修不踩坑，从选对人开始。

想了解更多，私信"装修"，我发你一份避坑清单。`,
    structure: {
      hook: "痛点提问式开场",
      logic: "痛点刺激 → 认知反转 → 专业建议 → 分点展开 → 安心结果",
      sections: [
        "用户装修后悔场景",
        "错误装修认知",
        "三项不能省的关键工程",
        "专业服务承诺",
        "结果价值"
      ]
    },
    suggestions: [
      "前3秒建议用强痛点开场，提高完播率",
      "可以加入真实工地案例增强信任",
      "结尾建议加入私信关键词引导"
    ]
  }
}

export default function Home() {
  const [state, setState] = useState<GenerateState>("idle")
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  
  const [formData, setFormData] = useState<FormData>({
    document: "",
    industry: "装修设计",
    usage: "短视频口播",
    styles: ["专业", "成交导向", "口语化"],
    wordCount: "400 字左右",
    count: 1
  })

  const handleGenerate = useCallback(async () => {
    if (formData.document.length < 30) {
      setError("请输入至少30字的行业文案撰写文档")
      return
    }

    setState("loading")
    setError(null)
    setCurrentStep(0)
    setProgress(0)
    setResult(null)

    // Simulate step progression
    const stepIntervals = [1000, 2000, 2000, 2000, 1000]
    let currentStepLocal = 0
    
    const stepTimer = setInterval(() => {
      if (currentStepLocal < 4) {
        currentStepLocal++
        setCurrentStep(currentStepLocal)
      }
    }, stepIntervals[currentStepLocal] || 2000)

    // Simulate progress
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev
        if (prev < 15) return prev + 3
        if (prev < 38) return prev + 2
        if (prev < 68) return prev + 1.5
        if (prev < 88) return prev + 0.8
        return prev + 0.3
      })
    }, 100)

    try {
      const response = await mockGenerateResponse(formData)
      clearInterval(stepTimer)
      clearInterval(progressTimer)
      setCurrentStep(5)
      setProgress(100)
      setResult(response)
      setState("success")
    } catch (err) {
      clearInterval(stepTimer)
      clearInterval(progressTimer)
      setError("AI 服务暂时繁忙，请稍后再试")
      setState("error")
    }
  }, [formData])

  const handleRegenerate = useCallback(() => {
    handleGenerate()
  }, [handleGenerate])

  return (
    <main className="min-h-screen">
      <Header />
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
