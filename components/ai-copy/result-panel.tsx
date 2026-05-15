"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check, RefreshCw, FileText, Heading, Layers, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GenerateResult } from "@/app/page"

interface ResultPanelProps {
  result: GenerateResult
  onRegenerate: () => void
}

type Tab = "content" | "titles" | "structure" | "suggestions"

const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "content", label: "生成文案", icon: FileText },
  { key: "titles", label: "备选标题", icon: Heading },
  { key: "structure", label: "结构拆解", icon: Layers },
  { key: "suggestions", label: "优化建议", icon: Lightbulb },
]

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={cn("text-muted-foreground hover:text-foreground", className)}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-1 text-primary" />
          已复制
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-1" />
          复制
        </>
      )}
    </Button>
  )
}

export function ResultPanel({ result, onRegenerate }: ResultPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("content")

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center border-b border-border bg-secondary/30">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative",
                activeTab === tab.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          )
        })}
        
        <div className="ml-auto px-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            className="border-primary/30 text-primary hover:bg-primary/10"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            重新生成
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "content" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">生成的文案</h4>
              <CopyButton text={result.content} />
            </div>
            <div className="bg-secondary/50 rounded-lg p-4 whitespace-pre-wrap text-foreground leading-relaxed">
              {result.content}
            </div>
          </div>
        )}

        {activeTab === "titles" && (
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">备选标题</h4>
            <div className="space-y-2">
              {result.titles.map((title, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-secondary/50 rounded-lg p-3 group hover:bg-secondary/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-foreground">{title}</span>
                  </div>
                  <CopyButton text={title} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "structure" && (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-foreground mb-2">开头钩子</h4>
              <div className="bg-secondary/50 rounded-lg p-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm bg-primary/20 text-primary">
                  {result.structure.hook}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">文案逻辑</h4>
              <div className="bg-secondary/50 rounded-lg p-3 text-foreground">
                {result.structure.logic}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">结构分段</h4>
              <div className="space-y-2">
                {result.structure.sections.map((section, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3"
                  >
                    <div className="w-6 h-6 rounded bg-accent/20 text-accent text-xs font-medium flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="text-foreground">{section}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "suggestions" && (
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">优化建议</h4>
            <div className="space-y-3">
              {result.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex gap-3 bg-secondary/50 rounded-lg p-4"
                >
                  <div className="w-6 h-6 rounded-full bg-warning/20 text-warning text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb className="w-3 h-3" />
                  </div>
                  <p className="text-foreground leading-relaxed">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
