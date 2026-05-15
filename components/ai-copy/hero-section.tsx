import { Zap, Target, Lightbulb, MessageSquare, Users, Bot } from "lucide-react"

const capabilities = [
  { icon: Target, label: "行业解析" },
  { icon: Zap, label: "结构拆解" },
  { icon: Lightbulb, label: "爆款标题" },
  { icon: MessageSquare, label: "口播文案" },
  { icon: Users, label: "私域成交" },
  { icon: Bot, label: "私有模型" },
]

export function HeroSection() {
  return (
    <section className="text-center py-12 relative">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance text-glow-green">
          AI 爆款文案复刻引擎
        </h2>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty leading-relaxed">
          输入行业文案撰写文档，AI 自动拆解业务信息、提炼成交逻辑，
          并生成适合短视频、私域和本地获客的高转化文案
        </p>
        
        <div className="flex flex-wrap justify-center gap-3">
          {capabilities.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-foreground/90 hover:border-primary/30 transition-colors"
            >
              <Icon className="w-4 h-4 text-primary" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
