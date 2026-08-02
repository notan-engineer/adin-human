/**
 * YeshInvoice (https://yeshinvoice.co.il/) - hosted payment page + invoicing.
 * DEFAULT payment provider. Ships as a STUB: with no credentials configured it
 * never touches the network, so the whole checkout flow runs with zero keys.
 *
 * ─── What YeshInvoice actually is ───────────────────────────────────────────
 * YeshInvoice is NOT an acquirer. It is an invoicing platform that ORCHESTRATES
 * over a real clearing provider that the merchant contracts separately -
 * Grow/Meshulam, Pelecard, Cardcom, Tranzila, Z-Credit, Upay, EasyCard, … So a
 * live integration needs BOTH a YeshInvoice account AND a merchant clearing
 * agreement. Which acquirer sits underneath is observable in the webhook (see
 * `parseYeshInvoiceCallback`), because the status field name is acquirer-specific.
 *
 * ─── API shape ──────────────────────────────────────────────────────────────
 * Base URL:  https://api.yeshinvoice.co.il/api/v1/
 * Auth:      the `Authorization` header is a JSON OBJECT LITERAL, not a Bearer
 *            token:  Authorization: {"secret":"<SECRET>","userkey":"<USER_KEY>"}
 * Envelope:  every response is { Success: boolean, ErrorMessage: string,
 *            ReturnValue: any } and - critically - `Success:false` STILL RETURNS
 *            HTTP 200. Never branch on the status code; always read `Success`.
 *
 * ─── The flow we implement ──────────────────────────────────────────────────
 *   1. createHostedCheckout → POST /api/v1/createPayment with the body built by
 *      `buildCreatePaymentBody`. `ReturnValue` comes back as a BARE URL STRING,
 *      e.g. "https://user.yeshinvoice.co.il/paymentPage/<GUID>". That GUID is the
 *      ONLY transaction handle YeshInvoice gives us → we use it as `providerRef`.
 *   2. Customer pays on the hosted page (card incl. Isracard, Bit, Apple/Google
 *      Pay, PayPal, installments).
 *   3. YeshInvoice POSTs `NotifyUrl` (form-urlencoded, NOT JSON) and separately
 *      bounces the browser to `SuccessUrl`.
 *   4. YeshInvoice issues the tax document itself (DocumentType 9 = חשבונית
 *      מס/קבלה), which is why `capabilities.issuesTaxDocument` is true.
 *
 * ─── Known gaps, encoded honestly below ─────────────────────────────────────
 * 🔴 NO signature/HMAC on the webhook. YeshInvoice's own WooCommerce plugin calls
 *    payment_complete() with zero verification - a real auth-bypass. We therefore
 *    treat the notify as an UNTRUSTED WAKE-UP HINT only, never as proof of payment.
 * 🔴 NO status-by-reference endpoint is documented. Status can only be
 *    APPROXIMATED via POST /api/v1/getInvoices. See `getStatus`.
 * 🔴 NO refund endpoint. `cancelDocument` issues a credit note (חשבונית זיכוי);
 *    it does NOT reverse the charge at the acquirer. See `refund`.
 *
 * MONEY: internally everything is INTEGER AGOROT. YeshInvoice's `TotalPrice` is a
 * DECIMAL in shekels, so the /100 conversion happens ONLY at this boundary.
 */

import type {
  CreateHostedCheckoutInput,
  NormalizedPayment,
  PaymentCallbackRequest,
  PaymentProvider,
  PaymentProviderCapabilities,
  RefundInput,
} from "../../ports/payment";
import { CommerceError } from "../../errors";

/** Documented base URL. NOTE: sandbox is NOT a separate host - see the doc note. */
export const YESHINVOICE_BASE_URL = "https://api.yeshinvoice.co.il/api/v1";

/**
 * ⚠️ ILS CurrencyID is AMBIGUOUS in YeshInvoice's own material: the API docs say
 * `2`, while their WooCommerce plugin sends `1`. We deliberately do NOT hardcode
 * a guess - it comes from env (default 1, matching the shipping plugin, which is
 * the more likely-to-be-correct real-world evidence).
 *
 * ✅ Resolve this definitively before go-live: `POST /api/v1/getAllCurrencies`
 * returns the id↔currency table for the account. See docs/yeshinvoice-integration.md.
 */
export function ilsCurrencyId(): number {
  const raw = process.env.YESHINVOICE_CURRENCY_ID_ILS;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 1;
}

/** DocumentType 9 = חשבונית מס/קבלה (tax invoice + receipt), the paid B2C doc. */
export function documentType(): number {
  const parsed = Number.parseInt(process.env.YESHINVOICE_DOCUMENT_TYPE ?? "", 10);
  return Number.isFinite(parsed) ? parsed : 9;
}

/** InvoiceLangID: 359 = Hebrew, 139 = English. */
export function invoiceLangId(locale: "he" | "en"): number {
  const key =
    locale === "en" ? "YESHINVOICE_LANG_ID_EN" : "YESHINVOICE_LANG_ID_HE";
  const fallback = locale === "en" ? 139 : 359;
  const parsed = Number.parseInt(process.env[key] ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * True when real credentials are present. When false the adapter runs in STUB
 * mode: no network calls, deterministic refs, and the redirect loops through our
 * own callback so the local flow completes end-to-end.
 */
export function yeshInvoiceEnvConfigured(): boolean {
  return Boolean(
    process.env.YESHINVOICE_SECRET && process.env.YESHINVOICE_USERKEY,
  );
}

/**
 * The `Authorization` header value - a JSON object literal, NOT `Bearer …`.
 * (Yes, really. This is what their API expects.)
 */
export function yeshInvoiceAuthHeader(): string {
  return JSON.stringify({
    secret: process.env.YESHINVOICE_SECRET ?? "",
    userkey: process.env.YESHINVOICE_USERKEY ?? "",
  });
}

/** The `POST /api/v1/createPayment` request body. Field names are theirs, verbatim. */
export interface YeshInvoiceCreatePaymentBody {
  /** Browser lands here after a successful payment. UNTRUSTED as proof of payment. */
  SuccessUrl: string;
  /** Browser lands here on failure/cancel. */
  ErrorUrl: string;
  /** Server-to-server webhook. Form-urlencoded POST, unsigned. */
  NotifyUrl: string;
  /** ⚠️ DECIMAL SHEKELS (e.g. 119 for ₪119.00) - NOT agorot. */
  TotalPrice: number;
  /** Line description shown on the hosted page and the issued document. */
  InvoiceName: string;
  /** 359 = Hebrew, 139 = English. */
  InvoiceLangID: number;
  /** Our order id - echoed back verbatim in the webhook. Our correlation key. */
  UniqueID: string;
  /** Human-facing order number (we reuse the order id). */
  OrderNumber: string;
  /** 9 = חשבונית מס/קבלה. */
  DocumentType: number;
  /** See `ilsCurrencyId()` - 1 vs 2 must be confirmed before go-live. */
  CurrencyID: number;
  /** false ⇒ DO create the tax document (double negative is theirs). */
  NoCreateInvoice: boolean;
  /** Email the issued document to the customer. */
  SendInvoiceEmail: boolean;
  /** Customer ת.ז / ח.פ, printed on the tax document. */
  InvoiceNumberID?: string;
  InvoiceEmailAddress?: string;
  InvoicePhone?: string;
  InvoiceAddress?: string;
  InvoiceCity?: string;
  /** Installment bounds offered on the hosted page. */
  MinPayments?: number;
  MaxPayments?: number;
  /** 1 = immediate charge, 2 = J5 authorization hold. */
  PaymentType?: number;
  /** Free passthrough fields, echoed back. We use them for audit breadcrumbs. */
  Fields1?: string;
  Fields2?: string;
  Fields3?: string;
}

/**
 * PURE helper: map our provider-agnostic {@link CreateHostedCheckoutInput} onto
 * YeshInvoice's `createPayment` body. Extracted so it is unit-testable and so
 * wiring real credentials later is a one-line `fetch` away.
 *
 * Field mapping (ours → theirs):
 *   successUrl              → SuccessUrl
 *   cancelUrl               → ErrorUrl
 *   callbackUrl             → NotifyUrl
 *   amountAgorot / 100      → TotalPrice          ⚠️ agorot → decimal shekels
 *   items[…].name           → InvoiceName         (joined; first line + count)
 *   orderId                 → UniqueID, OrderNumber
 *   customer.email          → InvoiceEmailAddress
 *   customer.phone          → InvoicePhone
 *   customer.taxId          → InvoiceNumberID     (ת.ז / ח.פ on the document)
 *   idempotencyKey          → Fields1             (audit breadcrumb only - their
 *                                                  API has no idempotency key)
 *   locale                  → InvoiceLangID       (359 he / 139 en)
 */
export function buildCreatePaymentBody(
  input: CreateHostedCheckoutInput,
  opts: { locale?: "he" | "en" } = {},
): YeshInvoiceCreatePaymentBody {
  const locale = opts.locale ?? "he";

  // ⚠️ THE conversion boundary. Agorot are integers internally; TotalPrice is a
  // decimal in shekels. Round to 2dp to avoid float dust (e.g. 11900 → 119).
  const totalPrice = Math.round(input.amountAgorot) / 100;

  const first = input.items[0];
  const invoiceName = first
    ? input.items.length > 1
      ? `${first.name} +${input.items.length - 1}`
      : first.name
    : `הזמנה ${input.orderId}`;

  return {
    SuccessUrl: input.successUrl,
    ErrorUrl: input.cancelUrl,
    NotifyUrl: input.callbackUrl,
    TotalPrice: totalPrice,
    InvoiceName: invoiceName,
    InvoiceLangID: invoiceLangId(locale),
    UniqueID: input.orderId,
    OrderNumber: input.orderId,
    DocumentType: documentType(),
    CurrencyID: ilsCurrencyId(),
    NoCreateInvoice: false, // false ⇒ do create the tax document.
    SendInvoiceEmail: true,
    InvoiceNumberID: input.customer.taxId,
    InvoiceEmailAddress: input.customer.email,
    InvoicePhone: input.customer.phone,
    Fields1: input.idempotencyKey,
    Fields2: input.orderId,
  };
}

/** What we can extract from an (unsigned, untrusted) YeshInvoice notify POST. */
export interface ParsedYeshInvoiceCallback {
  /** Our order id, echoed back from `UniqueID`. */
  orderId?: string;
  /** The acquirer's transaction id. */
  transactionId?: string;
  /**
   * The acquirer-specific status field VALUE, if we recognized one. The KEY name
   * differs per clearing provider (`PelecardStatusCode`, etc.), so we scan a set
   * of known suffixes rather than assuming one name.
   */
  statusCode?: string;
  /** Which key the status came from - useful for identifying the acquirer. */
  statusField?: string;
  /** Every field, flattened, for auditing. */
  fields: Record<string, string>;
}

/**
 * PURE helper: parse a YeshInvoice notify body.
 *
 * ⚠️ The body is `application/x-www-form-urlencoded`, NOT JSON. Callers must pass
 * the RAW text (`await request.text()`), never `await request.json()`.
 *
 * 🔴 There is NO signature to check. This function PARSES; it does not VERIFY.
 * The result is a hint that something happened for an order - the caller MUST
 * independently confirm the amount and payment state before fulfilling.
 */
export function parseYeshInvoiceCallback(
  rawBody: string,
): ParsedYeshInvoiceCallback {
  const params = new URLSearchParams(rawBody ?? "");
  const fields: Record<string, string> = {};
  for (const [k, v] of params) fields[k] = v;

  // The status field name is acquirer-specific (Pelecard → `PelecardStatusCode`,
  // Cardcom → its own, …). Match on the shape instead of one hardcoded name.
  const statusField = Object.keys(fields).find(
    (k) => /statuscode$/i.test(k) || /^status$/i.test(k),
  );

  return {
    orderId: fields.UniqueID || undefined,
    transactionId: fields.transaction_id || undefined,
    statusCode: statusField ? fields[statusField] : undefined,
    statusField,
    fields,
  };
}

/**
 * Extract the GUID from a hosted-page URL:
 *   https://user.yeshinvoice.co.il/paymentPage/<GUID>  →  <GUID>
 * The GUID is the only transaction handle YeshInvoice returns, so it becomes our
 * `providerRef`. Falls back to the whole string if the shape is unexpected.
 */
export function extractPaymentPageGuid(url: string): string {
  const segments = url.split("?")[0].split("/").filter(Boolean);
  return segments[segments.length - 1] ?? url;
}

/**
 * Deterministic stub ref, so a retried checkout for the same order yields the
 * same handle (their API has no idempotency key of its own). Shaped like a GUID
 * so downstream code sees realistic data.
 */
function stubGuidFor(orderId: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < orderId.length; i += 1) {
    h ^= orderId.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  const hex = (n: number) => (h + n >>> 0).toString(16).padStart(8, "0");
  return `${hex(0)}-${hex(1).slice(0, 4)}-4${hex(2).slice(0, 3)}-a${hex(3).slice(0, 3)}-${hex(4)}${hex(5).slice(0, 4)}`;
}

export class YeshInvoicePaymentProvider implements PaymentProvider {
  readonly id = "yeshinvoice";

  readonly capabilities: PaymentProviderCapabilities = {
    hostedRedirect: true,
    inlineTokenized: false, // No tokenized/inline card API - hosted page only.
    bit: true,
    applePay: true,
    googlePay: true,
    issuesTaxDocument: true, // DocumentType 9 = חשבונית מס/קבלה, issued by them.
    refunds: false, // 🔴 No refund endpoint exists. See `refund()`.
    recurring: false,
  };

  async createHostedCheckout(
    input: CreateHostedCheckoutInput,
  ): Promise<{ providerRef: string; redirectUrl: string }> {
    const body = buildCreatePaymentBody(input);

    if (yeshInvoiceEnvConfigured()) {
      // ── REAL MODE ──────────────────────────────────────────────────────────
      // POST /api/v1/createPayment. Remember: Success:false still returns HTTP
      // 200, so branch on the envelope body, never on `res.ok`.
      const res = await fetch(`${YESHINVOICE_BASE_URL}/createPayment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: yeshInvoiceAuthHeader(),
        },
        body: JSON.stringify(body),
      });
      const envelope = (await res.json()) as {
        Success?: boolean;
        ErrorMessage?: string;
        ReturnValue?: unknown;
      };
      if (!envelope?.Success || typeof envelope.ReturnValue !== "string") {
        throw new CommerceError(
          "payment_provider_error",
          `YeshInvoice createPayment failed: ${envelope?.ErrorMessage ?? "unknown error"}`,
          502,
        );
      }
      // ReturnValue is a BARE URL STRING, not an object.
      const redirectUrl = envelope.ReturnValue;
      return { providerRef: extractPaymentPageGuid(redirectUrl), redirectUrl };
    }

    // ── STUB MODE ────────────────────────────────────────────────────────────
    // No network. Mirror the real hop (hosted page → notify → success) by routing
    // the browser through OUR callback carrying YeshInvoice-shaped params, so the
    // order actually gets marked paid locally instead of silently landing on the
    // success page unpaid. `return` is open-redirect-guarded in the route.
    const providerRef = stubGuidFor(input.orderId);
    const redirectUrl =
      `${input.callbackUrl}?UniqueID=${encodeURIComponent(input.orderId)}` +
      `&transaction_id=${encodeURIComponent(providerRef)}` +
      `&status=approved` +
      `&return=${encodeURIComponent(input.successUrl)}`;
    return { providerRef, redirectUrl };
  }

  async parseAndVerifyCallback(
    req: PaymentCallbackRequest,
  ): Promise<NormalizedPayment> {
    // ⚠️ Form-urlencoded, not JSON - the route hands us the raw text.
    const parsed = parseYeshInvoiceCallback(req.rawBody);

    // Fall back to the query string (the stub's browser-return hop carries the
    // same fields there).
    const orderId = parsed.orderId ?? req.query?.UniqueID;
    const providerRef =
      parsed.transactionId ?? req.query?.transaction_id ?? orderId ?? "unknown";

    // 🔴 THIS IS NOT VERIFICATION - and it deliberately FAILS CLOSED.
    // YeshInvoice signs nothing, so anyone who can reach NotifyUrl can post this
    // exact body. In real mode we therefore report `pending`, which the callback
    // route does NOT treat as fulfillable: an unsigned notify can never, on its
    // own, release goods or mark an order paid. (Reporting `authorized` here
    // would still trigger fulfillment - i.e. exactly the bug in YeshInvoice's
    // own WooCommerce plugin, which calls payment_complete() unverified.)
    //
    // To go live, a real confirmation step must be added before this can return
    // a fulfillable status. It must independently establish that
    //   (a) the order exists and is still unpaid, and
    //   (b) the amount actually captured matches `order.totalAgorot`.
    // No status-by-ref endpoint exists (see `getStatus`), so that reconciliation
    // is currently manual/back-office. Blocker: capture one real notify payload
    // for the merchant's actual acquirer - see docs/yeshinvoice-integration.md.
    //
    // Stub mode (no credentials) returns `paid` so local/demo flows complete.
    //
    // `amountAgorot: 0` is deliberate: the notify does not carry a trustworthy
    // amount, and inventing one would let a forged webhook assert a total.
    return {
      providerRef,
      orderId,
      status: yeshInvoiceEnvConfigured() ? "pending" : "paid",
      amountAgorot: 0,
      method: "card",
      raw: {
        stub: !yeshInvoiceEnvConfigured(),
        unverified: true,
        parsed,
        query: req.query ?? null,
      },
    };
  }

  async getStatus(providerRef: string): Promise<NormalizedPayment> {
    if (yeshInvoiceEnvConfigured()) {
      // 🔴 UNSUPPORTED. YeshInvoice documents no "get payment by reference"
      // endpoint - the paymentPage GUID cannot be queried. The only approximation
      // is `POST /api/v1/getInvoices` (list documents, then match on our UniqueID
      // / OrderNumber / amount), which is a different question ("was a document
      // issued?") from the one we are asking ("was this charge captured?").
      // Deliberately fail loudly rather than return an optimistic guess that
      // would auto-fulfil unpaid orders.
      throw new CommerceError(
        "payment_status_unsupported",
        "YeshInvoice exposes no status-by-reference endpoint; approximate via POST /api/v1/getInvoices matching UniqueID/OrderNumber. See docs/yeshinvoice-integration.md.",
        501,
      );
    }

    // STUB MODE: report paid so the local browser-return flow completes.
    return {
      providerRef,
      status: "paid",
      amountAgorot: 0,
      method: "card",
      raw: { stub: true, note: "no status-by-ref endpoint in the real API" },
    };
  }

  async refund(i: RefundInput): Promise<NormalizedPayment> {
    // 🔴 YeshInvoice exposes NO refund API. `cancelDocument` issues a credit note
    // (חשבונית זיכוי) - an accounting document - which does NOT reverse the
    // charge at the acquirer. An actual money-back has to be done in the clearing
    // provider's back office (Pelecard/Cardcom/Grow/…), by whoever holds the
    // merchant agreement. Surfacing this as a hard error is the honest behavior;
    // silently "succeeding" would leave a refunded-looking order with the money
    // still captured.
    throw new CommerceError(
      "refund_unsupported",
      `YeshInvoice exposes no refund API (ref ${i.providerRef}). Issue the refund in the clearing provider's back office; cancelDocument only issues a credit note.`,
      501,
    );
  }
}
