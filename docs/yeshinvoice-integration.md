# YeshInvoice integration

Payment + invoicing for The Heuman Chef. Adapter:
`lib/commerce/adapters/payment/yeshinvoice-stub.ts` (implements the
provider-agnostic `PaymentProvider` port). Selected by `PAYMENT_PROVIDER` —
`yeshinvoice` is the **default**; unset and the legacy value `stub` both resolve
to it.

With `YESHINVOICE_SECRET` / `YESHINVOICE_USERKEY` blank the adapter runs in
**stub mode**: no network calls, deterministic refs, and the checkout redirect
loops through our own `/api/payment/callback` so the local flow completes.

## What YeshInvoice is (and is not)

YeshInvoice is an **invoicing platform with a hosted payment page**. It is **not
an acquirer** — it orchestrates over a clearing provider the merchant contracts
separately (Grow/Meshulam, Pelecard, Cardcom, Tranzila, Z-Credit, Upay,
EasyCard…). Going live therefore needs **both** a YeshInvoice account **and** a
merchant clearing agreement.

Instruments offered on the hosted page: cards (incl. Isracard), Bit, Apple Pay,
Google Pay, PayPal, installments.

## API basics

| | |
|---|---|
| Base URL | `https://api.yeshinvoice.co.il/api/v1/` |
| Auth header | `Authorization: {"secret":"<SECRET>","userkey":"<USER_KEY>"}` — a **JSON object literal**, not `Bearer` |
| Response envelope | `{ Success: boolean, ErrorMessage: string, ReturnValue: any }` |

⚠️ **`Success: false` still returns HTTP 200.** Never branch on the status code;
always read `Success` from the body. The adapter does this in
`createHostedCheckout`.

## Flow

1. `POST /api/v1/createPayment` → `ReturnValue` is a **bare URL string**, e.g.
   `https://user.yeshinvoice.co.il/paymentPage/<GUID>`. The **GUID is the only
   transaction handle** YeshInvoice returns, so we use it as `providerRef`
   (`extractPaymentPageGuid`).
2. Customer pays on the hosted page.
3. YeshInvoice POSTs `NotifyUrl` (**`application/x-www-form-urlencoded`, not
   JSON**) and separately bounces the browser to `SuccessUrl`.
4. YeshInvoice issues the tax document itself (`DocumentType: 9` = חשבונית
   מס/קבלה), so `capabilities.issuesTaxDocument` is `true`.

## Field mapping (`buildCreatePaymentBody`)

| Ours (`CreateHostedCheckoutInput`) | YeshInvoice (`createPayment`) | Notes |
|---|---|---|
| `successUrl` | `SuccessUrl` | Browser return. **Untrusted** — never fulfil on it alone. |
| `cancelUrl` | `ErrorUrl` | Failure / cancel landing. |
| `callbackUrl` | `NotifyUrl` | Server-to-server notify. Unsigned. |
| `amountAgorot / 100` | `TotalPrice` | ⚠️ **Decimal shekels, NOT agorot.** `11900 → 119`. The only conversion point; agorot stay integer everywhere else. |
| `items[0].name` (+ `+N`) | `InvoiceName` | Line description on page + document. |
| `orderId` | `UniqueID` | Echoed back verbatim in the webhook — our correlation key. |
| `orderId` | `OrderNumber` | Human-facing order number. |
| locale | `InvoiceLangID` | `359` = Hebrew, `139` = English. |
| — | `DocumentType` | `9` = חשבונית מס/קבלה (`YESHINVOICE_DOCUMENT_TYPE`). |
| — | `CurrencyID` | See "Verify before go-live" (a). `YESHINVOICE_CURRENCY_ID_ILS`. |
| — | `NoCreateInvoice: false` | Double negative is theirs: `false` ⇒ **do** create the document. |
| — | `SendInvoiceEmail: true` | Email the document to the customer. |
| `customer.taxId` | `InvoiceNumberID` | ת.ז / ח.פ printed on the tax document. |
| `customer.email` | `InvoiceEmailAddress` | |
| `customer.phone` | `InvoicePhone` | |
| `idempotencyKey` | `Fields1` | Audit breadcrumb only — their API has **no** idempotency key. |
| `orderId` | `Fields2` | Passthrough echo. |

Also available and unused today: `InvoiceAddress`, `InvoiceCity`,
`MinPayments` / `MaxPayments` (installment bounds), `PaymentType`
(`1` = charge, `2` = J5 hold), `Fields3`.

## Trust model 🔴

**The webhook is unauthenticated.** YeshInvoice signs nothing — no HMAC, no
shared secret in the payload. Their own WooCommerce plugin calls
`payment_complete()` with zero verification, which is a real auth bypass.

Consequences baked into this codebase:

- `parseYeshInvoiceCallback` **parses; it does not verify.** The adapter reports
  `authorized` (not `paid`) in real mode and returns `amountAgorot: 0`, because
  a forged body must never be able to assert a total.
- **Order ids are unguessable** — `ord_` + `randomUUID()`, not `ord_1`
  (`lib/commerce/adapters/repository/memory.ts`). With sequential ids, anyone
  who can reach `/api/payment/callback` could enumerate `UniqueID` and mark every
  order paid. Keep this property in any DB-backed repository: **do not expose an
  auto-increment primary key as the order id.**
- **Never fulfil on the `SuccessUrl` redirect alone** — it is user-controllable
  and races the notify. `app/api/payment/callback/route.ts` re-confirms before
  mutating order state in both the GET and POST branches.
- `markPaid` + `fulfillPaidOrder` are idempotent, so a replayed notify is safe.

The webhook body carries `UniqueID`, `transaction_id`, and an
**acquirer-specific** status field — e.g. `PelecardStatusCode` when clearing via
Pelecard. The key name differs per acquirer, so the parser matches on shape
(`*StatusCode` / `status`) rather than one hardcoded name.

## Missing capabilities 🔴

- **No status-by-reference endpoint** is documented. The paymentPage GUID cannot
  be queried. `getStatus` therefore throws `payment_status_unsupported` (501) in
  real mode rather than optimistically guessing — an optimistic guess would
  auto-fulfil unpaid orders. The only approximation is `POST /api/v1/getInvoices`
  (list documents, match on `UniqueID` / `OrderNumber` / amount), which answers a
  *different* question: "was a document issued?", not "was the charge captured?".
- **No refund endpoint.** `refund` throws `refund_unsupported` (501).
  `cancelDocument` issues a credit note (חשבונית זיכוי) — an accounting document
  — which does **not** reverse the charge at the acquirer. Real money-back has to
  happen in the clearing provider's back office.

## Allocation number (מספר הקצאה)

Not automatic. Per document:

1. `GET /getisraelTax`
2. `POST /setisraelTax`
3. `POST /api/v1.1/approvalIsraelTax { docid }`

The Tax Authority grant **expires** — check `getDataIsraelTax.isValid` and
re-authorize. This is not wired up yet.

## Verify before go-live

- [ ] **(a) ILS `CurrencyID`: 1 or 2?** The docs say `2`; their WooCommerce
      plugin sends `1`. We default to `1` via `YESHINVOICE_CURRENCY_ID_ILS`.
      Resolve definitively with `POST /api/v1/getAllCurrencies` for this account.
- [ ] **(b) Is there any status-by-reference endpoint?** Ask support directly. If
      not, decide the reconciliation strategy (`getInvoices` polling vs. manual
      back-office check) and implement it in `getStatus`.
- [ ] **(c) Which acquirer does the merchant use?** This determines the webhook's
      status field name (`PelecardStatusCode`, …) and the success-value mapping.
      Hardcode the confirmed mapping once known.
- [ ] **(d) Capture one real webhook payload** end-to-end and pin the exact field
      names/values in a test. Everything above is documented behavior, not
      observed behavior.
- [ ] **(e) Refund path.** Confirm it is manual/back-office and document who does
      it and how it reconciles with the issued credit note.
- [ ] **(f) Allocation-number automation** and grant-expiry handling
      (`isValid`), plus what happens to a document issued while the grant is
      expired.
- [ ] **(g) Sandbox isolation.** YeshInvoice shares the **production base URL** —
      there is no separate sandbox host. Confirm how test transactions are
      isolated before pointing real keys at a running site, or you will issue real
      tax documents while testing.
