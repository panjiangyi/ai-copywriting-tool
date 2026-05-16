# AI Copywriting Tool

这是一个 Next.js 全栈文案生成工具。浏览器只调用本项目后端接口，后端再调用 AI（默认通过本机 `claude` CLI，可切换为 OpenClaw Gateway）。

## AI Provider 切换

后端通过 `AI_PROVIDER` 环境变量选择 AI 后端：

| 值 | 后端调用方式 |
|---|---|
| `claude`（默认） | 子进程调用本机已登录的 `claude` CLI，复用其 base_url / api_key / 默认模型配置 |
| `openclaw` | HTTP 直连 OpenClaw Gateway（旧方案，保留作 fallback） |

健康检查端点：

```http
GET /api/health/claude     # 强制走 claude CLI
GET /api/health/openclaw   # 强制走 OpenClaw
```

## 本地环境变量

在 `.env.local` 中配置：

```bash
# 选择 provider
AI_PROVIDER=claude

# 仅在 AI_PROVIDER=claude 时生效（均为可选）
# CLAUDE_BIN_PATH=claude
# CLAUDE_TIMEOUT_MS=120000

# 仅在 AI_PROVIDER=openclaw 时必需
OPENCLAW_BASE_URL=http://127.0.0.1:18789
OPENCLAW_API_TOKEN=你的 OpenClaw Token
OPENCLAW_MODEL=openclaw:json-agent
```

`OPENCLAW_API_TOKEN` 只在服务端读取，不会暴露给前端。`claude` CLI 路径下后端只在服务端 spawn 子进程，不会把任何凭据交给浏览器。

## 前端调用后端

页面提交表单时调用：

```http
POST /api/generate
Content-Type: application/json
```

请求体：

```json
{
  "document": "我是做装修设计的，主要服务准备装修新房的业主……",
  "industry": "装修设计",
  "usage": "短视频口播",
  "styles": ["专业", "成交导向", "口语化"],
  "wordCount": "400 字左右",
  "count": 3
}
```

这里的 `count` 表示生成几条完整文案，不是标题数量。

## 后端调用 AI 的参数

后端在 `app/api/generate/route.ts` 中组装 prompt，然后通过 `lib/ai-provider.ts` 路由到具体 provider 实现（`lib/claude-cli.ts` 或 `lib/openclaw.ts`）。

### claude CLI 路径（默认）

后端 spawn 一个子进程：

```bash
claude -p --output-format json --append-system-prompt "<系统提示>"
```

用户 prompt 通过 stdin 传入，stdout 是 JSON：从 `.result` 取文案正文，从 `.usage.input_tokens` / `.usage.output_tokens` 取 token 计数。

### OpenClaw 路径

实际请求地址：

```text
POST {OPENCLAW_BASE_URL}/v1/chat/completions
```

实际请求头：

```http
Authorization: Bearer {OPENCLAW_API_TOKEN}
Content-Type: application/json
```

实际请求体形状：

```json
{
  "model": "openclaw:json-agent",
  "max_tokens": 1400,
  "messages": [
    {
      "role": "system",
      "content": "你是一个中文高转化营销文案引擎。你必须严格输出 JSON……"
    },
    {
      "role": "user",
      "content": "目标行业：装修设计\n文案用途：短视频口播\n文案风格：专业、成交导向、口语化\n目标字数：400 字左右\n需要生成文案数量：3\n\n请基于以下行业文案资料，生成更专业、更有转化力的中文文案：\n我是做装修设计的……"
    }
  ]
}
```

`model` 来自 `OPENCLAW_MODEL`，默认是 `openclaw:json-agent`。

## 要求 OpenClaw 返回的 JSON

服务端要求 OpenClaw 的 `choices[0].message.content` 是一个 JSON 字符串，结构如下：

```json
{
  "copies": [
    {
      "title": "装修不想踩坑？这几个细节先看清",
      "content": "完整文案正文……",
      "structure": {
        "hook": "痛点提问式开场",
        "logic": "痛点共鸣 -> 专业背书 -> 解决方案 -> 行动号召",
        "sections": ["痛点开场", "信任建立", "解决方案", "转化引导"]
      },
      "suggestions": ["前 3 秒用强痛点开场", "结尾加入私信关键词"]
    }
  ],
  "matchScore": 95
}
```

字段说明：

- `copies`: 文案数组，数量必须等于前端传入的 `count`
- `copies[].title`: 该条文案的标题
- `copies[].content`: 该条完整文案
- `copies[].structure`: 该条文案的结构拆解
- `copies[].suggestions`: 该条文案的优化建议
- `matchScore`: 资料匹配度，建议为 `80-99` 的数字

## 后端返回给前端的 JSON

`/api/generate` 会把 OpenClaw 的结果整理成页面需要的结构：

```json
{
  "requestId": "copy_1778835757819",
  "matchScore": 95,
  "totalWords": 1200,
  "titleCount": 3,
  "duration": 58.4,
  "titles": ["标题 1", "标题 2", "标题 3"],
  "content": "合并后的全部文案",
  "structure": {
    "hook": "第一条文案的开头钩子",
    "logic": "第一条文案的逻辑",
    "sections": ["第一条文案的结构分段"]
  },
  "suggestions": ["合并后的优化建议"],
  "copies": [
    {
      "title": "标题 1",
      "content": "完整文案 1",
      "structure": {
        "hook": "开头钩子",
        "logic": "文案逻辑",
        "sections": ["结构分段"]
      },
      "suggestions": ["优化建议"]
    }
  ]
}
```

`duration` 是服务端从收到 `/api/generate` 请求到整理好响应的总耗时，单位为秒，保留 1 位小数。

## JSON 修复机制

如果 OpenClaw 第一次返回的内容不是合法 JSON，后端会再调用一次 OpenClaw，让它把原始输出修复成目标 JSON。

修复请求仍然使用：

```json
{
  "model": "openclaw:json-agent",
  "max_tokens": 1400,
  "messages": [
    {
      "role": "system",
      "content": "你是一个中文高转化营销文案引擎……"
    },
    {
      "role": "user",
      "content": "下面是一次 AI 文案生成的原始输出，但它不符合目标 JSON schema……"
    }
  ]
}
```

如果修复后仍然不符合 schema，`/api/generate` 返回 `502`，前端显示 `AI 返回格式异常，请稍后再试`。

## OpenClaw 健康检查

可调用：

```http
GET /api/health/openclaw
```

成功响应：

```json
{
  "ok": true,
  "baseUrl": "http://127.0.0.1:18789",
  "model": "openclaw:json-agent"
}
```

该接口不会返回 Token。

## 常用命令

```bash
pnpm dev
pnpm build
```
