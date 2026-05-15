import { Sparkles, Cpu } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Cpu className="w-8 h-8 text-primary" />
            <Sparkles className="w-3 h-3 text-accent absolute -top-1 -right-1" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">
              AI 爆款文案复刻引擎
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Private AI Copywriting Console
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            系统在线
          </span>
        </div>
      </div>
    </header>
  )
}
