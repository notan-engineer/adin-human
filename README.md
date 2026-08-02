# The Heuman Chef - הצ'ף האנושי

Premium Israeli beef-jerky brand site by **Adin Human**. Dark, smoky, cinematic; bilingual **Hebrew (default, RTL)** + **English (LTR)**; a signature scroll-driven **smoker that opens to reveal the products**; and a complete order → pay → deliver flow that is *ready to integrate* with **HYP** payments and Israeli delivery carriers.

## Stack
- **Next.js 15** (App Router) · **React 19** · **TypeScript** (strict)
- **TailwindCSS 3.4** (RTL via logical utilities) · **shadcn/ui** (`rtl` + Radix `DirectionProvider`)
- **next-intl v4** - `he` default (unprefixed) + `en` at `/en`
- **Motion** (reveals) · **GSAP ScrollTrigger** (the smoker) · **Lenis** (smooth scroll)
- **Node SSR** runtime (self-host via **Docker**) - not static export (checkout/webhook route handlers)

## Getting started
```bash
npm install
cp .env.example .env.local     # all integrations default to working stubs
npm run dev                    # http://localhost:4000  (Hebrew) · /en (English)
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
| `npm run generate:icons` | Build the favicon / PWA icon set from the brand emblem |

## Architecture
Commerce is built on **provider-agnostic ports** (`lib/commerce/ports/*`) with working **stub adapters**, so real HYP keys and carrier credentials drop into typed seams without touching UI or business logic. Money is handled in **integer agorot**; VAT is applied at the boundary. See [the build plan](./docs/PLAN.md) for the full design.

## Deploy (self-hosted Docker)

The app is **Node SSR**, not a static export - checkout, the delivery quote, and the
payment callback are all route handlers that need a server. `next.config.mjs` sets
`output: "standalone"`, so the image ships `server.js` plus only the traced
production dependencies.

### Prepare the assets (once, before building)
Both scripts write into `public/`, which the image copies verbatim:
```bash
npm run optimize:images    # AVIF/WebP derivatives from design-resources/
npm run generate:icons     # favicons + PWA icons from the brand emblem
```

### Build and run
```bash
docker build -t heuman-chef --build-arg NEXT_PUBLIC_SITE_URL=https://theheumanchef.co.il .
docker run -d -p 4000:4000 --env-file .env.local heuman-chef
```

Or with Compose (reads `.env.local` if present):
```bash
cp .env.example .env.local   # then fill in the real values
docker compose up -d --build
```

### ⚠️ `NEXT_PUBLIC_SITE_URL` is a BUILD argument, not just a runtime one
Next.js inlines every `NEXT_PUBLIC_*` value at **build** time - in the server bundle
too, not only the client one. Setting it only under `environment:` silently has **no
effect**: `getSiteUrl()` keeps returning whatever was baked in, so the payment
provider gets `successUrl` / `NotifyUrl` pointing at the wrong host and shoppers are
redirected off your domain after paying. `docker-compose.yml` therefore passes it as
**both** a `build.args` entry and an env var - keep it that way, and rebuild (not
just restart) whenever the public URL changes.

### Environment variables
| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:4000` | Public base URL. Canonicals, OG images, and **all payment redirect/callback URLs**. Build-time - see above. |
| `PAYMENT_PROVIDER` | `yeshinvoice` | `yeshinvoice` \| `hyp` \| `payplus` \| `cardcom` |
| `DELIVERY_PROVIDER` | `stub` | Only the zone-table stub exists today |
| `INVOICE_PROVIDER` | `stub` | `stub` \| `hyp` |
| `ORDER_REPOSITORY` | `memory` | ⚠️ In-process - orders are lost on restart. Swap for a real DB before launch. |
| `YESHINVOICE_SECRET` / `YESHINVOICE_USERKEY` | *(empty)* | **Leave empty and the payment adapter runs in stub mode, completing payments offline without contacting anyone.** Required for real charges. |
| `YESHINVOICE_CURRENCY_ID_ILS` | `1` | ⚠️ `1` vs `2` is ambiguous in YeshInvoice's own docs - confirm via `POST /api/v1/getAllCurrencies` before go-live |
| `YESHINVOICE_DOCUMENT_TYPE` | `9` | `9` = חשבונית מס/קבלה |
| `YESHINVOICE_LANG_ID_HE` / `_EN` | `359` / `139` | Invoice language |
| `NEXT_PUBLIC_VAT_RATE` | `0.18` | VAT rate used for the inclusive-price split |

The container runs as a non-root `nextjs` user, exposes **4000**, and carries a
`HEALTHCHECK` that fetches `/` through the real Next router (so a process that is up
but failing to render is reported unhealthy).

## Design assets
Raw brand masters live in `design-resources/` (gitignored - heavy PSD/AI + 4000×5000 renders). Web-optimized derivatives are generated into `public/` via `npm run optimize:images` and committed.

## Status
Built in small, independently-revertable batches. Product copy, prices, and some claims are **placeholders tagged for review** until the brand confirms them.
