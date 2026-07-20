# The Heuman Chef — הצ'ף האנושי

Premium Israeli beef-jerky brand site by **Adin Human**. Dark, smoky, cinematic; bilingual **Hebrew (default, RTL)** + **English (LTR)**; a signature scroll-driven **smoker that opens to reveal the products**; and a complete order → pay → deliver flow that is *ready to integrate* with **HYP** payments and Israeli delivery carriers.

## Stack
- **Next.js 15** (App Router) · **React 19** · **TypeScript** (strict)
- **TailwindCSS 3.4** (RTL via logical utilities) · **shadcn/ui** (`rtl` + Radix `DirectionProvider`)
- **next-intl v4** — `he` default (unprefixed) + `en` at `/en`
- **Motion** (reveals) · **GSAP ScrollTrigger** (the smoker) · **Lenis** (smooth scroll)
- **Node SSR** runtime (self-host via **Docker**) — not static export (checkout/webhook route handlers)

## Getting started
```bash
npm install
cp .env.example .env.local     # all integrations default to working stubs
npm run dev                    # http://localhost:3000  (Hebrew) · /en (English)
```

## Scripts
| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint |
| `npm run test:unit` | Unit tests (money/VAT/repo/zones) |
| `npm run test:e2e` | Playwright (mobile 390 + desktop 1280, he+en) |
| `npm run optimize:images` | Build web-optimized AVIF/WebP from the brand renders |

## Architecture
Commerce is built on **provider-agnostic ports** (`lib/commerce/ports/*`) with working **stub adapters**, so real HYP keys and carrier credentials drop into typed seams without touching UI or business logic. Money is handled in **integer agorot**; VAT is applied at the boundary. See [the build plan](./docs/PLAN.md) for the full design.

## Design assets
Raw brand masters live in `design-resources/` (gitignored — heavy PSD/AI + 4000×5000 renders). Web-optimized derivatives are generated into `public/` via `npm run optimize:images` and committed.

## Status
Built in small, independently-revertable batches. Product copy, prices, and some claims are **placeholders tagged for review** until the brand confirms them.
