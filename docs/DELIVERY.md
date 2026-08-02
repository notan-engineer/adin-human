# The Heuman Chef - delivery report

Build of the bilingual (Hebrew-first) storefront for **The Heuman Chef by Adin Human**,
delivered in 17 independently-revertable commits.

---

## 1. Before / after

| | Before | After |
|---|---|---|
| Repo | Not a git repo. One empty `README.md` + a `design-resources/` asset drop | 17 commits, 186 tracked files |
| Code | 0 | ~11,300 LOC TS/TSX (app + lib + components + content + tests) |
| Pages | 0 | 36 prerendered routes (9 pages × 2 locales + PDPs + dynamic order page) |
| API | 0 | 10 Node route handlers (order, payment ×2, delivery ×2, invoice, address ×2, contact, newsletter) |
| Languages | - | Hebrew (default, RTL, unprefixed `/`) + English (`/en`), **259 keys each, parity enforced by a test** |
| Tests | 0 | **68 unit** (vitest) + **80 E2E** (Playwright: mobile 390 + desktop 1280 × he/en) |
| Accessibility | - | **0 axe violations at any severity** across 6 pages × 2 locales |
| Perf | - | First Load JS 102 kB shared · home 184 kB · checkout 151 kB · cart 136 kB. No CLS/LCP issues |
| Assets | 0.7 GB raw masters | 38 committed web assets (11 MB) - AVIF/WebP derivatives + sourced smoke video |
| Deploy | - | Docker image **built and verified serving** (369 MB, non-root, healthcheck) |

**What works end-to-end today:** cinematic hero → flavor grid → product pages → cart →
single-page checkout (zone-aware delivery, Israeli address autocomplete) → payment →
order confirmation with an issued invoice and a cleared cart. Verified by an automated
test that completes a real purchase.

---

## 2. Batch ledger - every change, with its restore command

Each batch is one commit and reverts cleanly on its own.

| # | Commit | What landed | Restore |
|---|---|---|---|
| 0 | `1d1e37a` | Repo hygiene: .gitignore, .env.example, README | `git revert 1d1e37a` |
| 1 | `3c1e456` | Next 15 + React 19 + TS + Tailwind + next-intl (he/en RTL) | `git revert 3c1e456` |
| 2 | `34981d9` | Brand tokens, dark smoky theme, Rubik/Heebo (he+latin) | `git revert 34981d9` |
| 3 | `ffe3fd8` | shadcn/ui foundation + Radix DirectionProvider | `git revert ffe3fd8` |
| 3f | `ddb8d2d` | Fix: serve Hebrew at `/`; drop the entry-gate CTA | `git revert ddb8d2d` |
| 4 | `eed510c` | Header, nav, footer, locale switch, mobile menu | `git revert eed510c` |
| 5 | `85bcea6` | Motion primitives + Lenis smooth scroll | `git revert 85bcea6` |
| 6 | `ef89964` | Cinematic hero (pivoted off the smoker) + image pipeline | `git revert ef89964` |
| 7 | `c30a0fb` | Catalog, product grid, PDPs, cart store | `git revert c30a0fb` |
| 8 | `c2a4484` | Cart page + VAT-inclusive order summary | `git revert c2a4484` |
| 9 | `d4bc66b` | Commerce ports + stub adapters + registry + tests | `git revert d4bc66b` |
| 10 | `6fde0a1` | Node API route handlers | `git revert 6fde0a1` |
| 11 | `1e04a26` | Single-page checkout + order confirmation | `git revert 1e04a26` |
| 12 | `3d457be` | YeshInvoice adapter (new default) + security hardening | `git revert 3d457be` |
| 13 | `f1ca7ba` | Story, stats, process, testimonials, newsletter, about, contact | `git revert f1ca7ba` |
| 14 | `c683882` | SEO: hreflang, OG cards, sitemap, robots, JSON-LD, icons | `git revert c683882` |
| 15 | `38ef6f3` | a11y + perf pass, Playwright suite, Docker | `git revert 38ef6f3` |

---

## 3. Decision log - calls made on your behalf

**Direction changes you made mid-build (all honoured):**
1. **Smoker concept dropped.** Built it, you judged it not good enough, removed it entirely.
   Kept what worked: real side-smoke, dark tone, flavor-glow pouches → product-forward hero.
2. **No entry gate.** "Enter the smoker" CTA read as a click-barrier → replaced; the visual is
   present on load.
3. **Real smoke, sourced not faked.** Pexels-licensed vertical smoke loop (commercial use, no
   attribution), self-hosted, `mix-blend-mode: screen`, edge-masked, disabled under reduced motion.
4. **Payment provider → YeshInvoice** (after PayPlus → HYP). Adapter swap only; no UI/API change.
5. **Delivery upstream, payment last.** All details captured and priced before the external page.
6. **Checkout redesigned** from a 3-step wizard to one page: order + products anchored top,
   collapsible sections, delivery **dropdown defaulting to regular delivery ₪35**.

**Technical calls (tagged for your review, all cheaply reversible):**
- **Node SSR, not static export** - checkout and the payment callback need a server.
- **Provider-agnostic ports** (`lib/commerce/ports/*`) so provider churn is an adapter swap. This
  is why switching PayPlus→HYP→YeshInvoice cost hours, not days.
- **Money as integer agorot** everywhere; formatted only at render. VAT 18%, prices VAT-inclusive
  (Israeli B2C), `net + vat === gross` guaranteed.
- **Flat ₪35 regular delivery** across zones (your instruction), zone machinery retained so
  per-region pricing can be switched back on.
- **`design-resources/` gitignored** (0.7 GB masters); only optimized derivatives committed.
- **Pouch renders soft-masked** - they ship with baked-in bright backgrounds; a radial mask melts
  those into a flavor glow so they read dark/on-brand.
- **UUID order IDs** instead of sequential - see security note below.
- **No `aggregateRating`/`review` structured data** - the testimonials are placeholders, so review
  schema would be fabricated (and a search-policy violation).
- **No kosher claim anywhere** - not confirmed by the brand.

**Bugs found by testing that a build alone would never have caught:**
- In-memory order store wasn't shared between API routes → every payment 404'd.
- `motion`'s own `useReducedMotion` freezes `null` on first render → content stuck at `opacity: 0`.
- `satori` (OG image renderer) has no bidi algorithm → **Hebrew rendered reversed** on every social card.
- `npm ci` couldn't install on Linux (optional peer-dep lockfile mismatch) → Docker build was broken.
- `NEXT_PUBLIC_SITE_URL` is inlined at **build** time even server-side → setting it only at runtime
  silently sends shoppers off-domain after paying.
- Salt was being published as schema.org `sodiumContent` (~2.5× off) - a materially false nutrition claim.

---

## 4. Parked - needs a decision or real data before launch

**Blocking for go-live:**
1. **Hebrew spelling of "Human"** (הומן / יומן?). Deliberately left in Latin script inside Hebrew
   copy rather than guess a real person's surname. One native check.
2. **Testimonials are invented.** Flagged in `content/testimonials.ts` as must-replace. Publishing
   fabricated reviews is misleading and unlawful in most markets. Replace with real feedback or
   remove the section.
3. **Prices and product copy are placeholders** (₪42/₪44/₪34, weights, descriptions). Real numbers needed.
4. **Stats "12 hours" and "100% natural" are invented.** `34g` protein and `6` flavors are real.
5. **YeshInvoice pre-launch checklist** - `docs/yeshinvoice-integration.md`. Headlines:
   - They are **not an acquirer** - a separate clearing agreement is required (Grow/Pelecard/Cardcom/…).
   - **No refund endpoint** and **no payment-status-by-reference endpoint** in their documented API.
   - **Their webhook is unsigned.** We fail closed: in configured mode the callback returns `pending`
     and never fulfils, until a real reconciliation step exists. Capture one live webhook payload for
     the merchant's actual acquirer - that unblocks everything else.
   - ILS `CurrencyID` is ambiguous (`1` vs `2`) - confirm via `getAllCurrencies`.
   - Allocation number (מספר הקצאה) is not automatic and its grant expires.

**Before real traffic:**
6. **Orders are in-memory** (`ORDER_REPOSITORY=memory`) - lost on restart. Swap for a real DB.
   The `OrderRepository` port exists precisely for this.
7. **`/api/contact` and `/api/newsletter` are unauthenticated stubs** - need rate limiting, and
   newsletter needs double opt-in.
8. **Delivery is a zone-table stub** - no real carrier is wired. `DeliveryProvider` port is ready.
9. Legal pages (terms, privacy, shipping/returns) are placeholder links.
10. Kosher certification badge is built but **off**; enable only once certified.
