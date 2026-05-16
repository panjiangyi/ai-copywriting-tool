# AI Copywriting Tool Agent Guide

## 1. Project Summary

This repo is a small **Next.js 16 single-page demo** for an AI copywriting product called **`AI 爆款文案复刻引擎`**.

Its current purpose is to present a high-fidelity front-end workflow for:

- pasting an industry/business briefing document
- choosing industry, usage, style, word count, and output count
- simulating an AI analysis flow with progress, steps, and logs
- showing generated copy, title candidates, structure breakdown, and suggestions

Important: generation now goes through the app backend. The browser calls `POST /api/generate`; that route calls the OpenClaw Gateway with server-side environment variables.

## 2. Actual Stack

- Framework: `Next.js 16.2.6`
- Language: `TypeScript`
- UI: `React 19`
- Styling: `Tailwind CSS v4`
- Icons: `lucide-react`
- Utilities/UI base: Radix-based components, `clsx`, `tailwind-merge`
- Analytics: `@vercel/analytics` only in production

## 3. Real App Structure

Main entry:

- `app/page.tsx`

Shell and metadata:

- `app/layout.tsx`
- `app/globals.css`

Feature components:

- `components/ai-copy/header.tsx`
- `components/ai-copy/hero-section.tsx`
- `components/ai-copy/input-panel.tsx`
- `components/ai-copy/process-panel.tsx`
- `components/ai-copy/metrics-panel.tsx`
- `components/ai-copy/result-panel.tsx`

Shared helper:

- `lib/utils.ts`

The large `components/ui/*` directory is mostly generated/shared UI primitives. The copywriting flow currently depends on only a small subset of them.

## 4. How The App Works Today

`app/page.tsx` owns the full product state:

- `state`: `idle | editing | loading | success | error`
- `formData`: document, industry, usage, styles, word count, count
- `result`: mocked generation result
- `currentStep` and `progress`: used by the animated process panel

Current generation flow:

1. Validate that the input document is at least 30 characters.
2. Switch UI into loading state.
3. Simulate progress and step advancement with timers.
4. Call `POST /api/generate`.
5. The route validates input, builds a structured prompt, calls OpenClaw, parses JSON, computes metrics, and returns the result.
6. Render the returned result payload.

There is no:

- server action
- persistence
- auth
- upload flow
- history

## 5. Product/UX Direction

The reference file `.claude/skills/SKILL.md` defines the intended product framing:

- private deployment
- front end -> self-hosted backend -> private model gateway
- “advanced AI engine” feel instead of a plain form
- strong emphasis on staged analysis feedback, logs, and result presentation

The current code already reflects that direction in the UI:

- dark cyberpunk visual system
- neon green / cyan accents
- glass-card panels
- progress animation and pseudo-terminal logs
- result tabs for content, titles, structure, and suggestions

## 6. What Is Implemented vs Not Implemented

Implemented:

- single-page marketing/product UI
- structured form inputs
- multi-select style tags
- loading/progress simulation
- backend route for generation
- OpenClaw Gateway integration
- server-side prompt assembly and JSON parsing
- OpenClaw health endpoint
- metrics cards with animated counters
- tabbed results
- copy-to-clipboard
- regenerate action

Not implemented:

- streaming generation
- database persistence
- user auth
- telemetry beyond Vercel analytics
- tests
- lint/config hygiene beyond a basic script
- documentation other than the skill note

## 7. Design And Code Constraints For Future Agents

- Treat this repo as a **small full-stack Next.js tool**, not a completed AI platform.
- Do not expose OpenClaw credentials in client components.
- Preserve the existing visual language unless the user explicitly asks for a redesign.
- Keep changes scoped to the actual product page; avoid touching the broad generated `components/ui/*` set unless necessary.
- Keep all OpenClaw calls behind route handlers.
- Keep `app/page.tsx` as the orchestration layer unless the page becomes too large, then extract state logic into a dedicated hook or feature module.

## 8. High-Priority Next Steps

Recommended implementation order:

1. Add smoke tests around `/api/generate`.
2. Add a browser happy-path test for the generation flow.
3. Support streaming or staged server updates so the progress panel maps to actual work.
4. Add request logging and operational monitoring.
5. Add persistence only if users need history.

## 9. Useful Commands

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`

## 10. Bottom Line

This project is a polished **AI copywriting console prototype** with a real server-side OpenClaw integration. The UI still uses simulated progress animation, while generation is handled by the backend.
