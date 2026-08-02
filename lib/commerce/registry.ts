/**
 * Provider registry - the single place the app resolves which adapter backs each
 * port. Selection is env-driven; everything else in the app depends only on the
 * PORT interfaces, so switching providers is a one-line env / registry change.
 *
 * Providers are module-level singletons (lazy). The in-memory repository is a
 * singleton on purpose so all callers share the same store within a process.
 *
 *   PAYMENT_PROVIDER   yeshinvoice | hyp | payplus | cardcom
 *                      (default: yeshinvoice; "stub" ⇒ yeshinvoice)
 *   DELIVERY_PROVIDER  stub                       (default: stub)
 *   INVOICE_PROVIDER   stub | hyp                 (default: stub)
 *   ORDER_REPOSITORY   memory                     (default: memory)
 */

import type { PaymentProvider } from "./ports/payment";
import type { DeliveryProvider } from "./ports/delivery";
import type { InvoiceProvider } from "./ports/invoice";
import type { OrderRepository } from "./ports/repository";

import { YeshInvoicePaymentProvider } from "./adapters/payment/yeshinvoice-stub";
import { HypStubPaymentProvider } from "./adapters/payment/hyp-stub";
import { PayplusStubPaymentProvider } from "./adapters/payment/payplus-stub";
import { CardcomStubPaymentProvider } from "./adapters/payment/cardcom-stub";
import { StubDeliveryProvider } from "./adapters/delivery/stub";
import { StubInvoiceProvider, HypInvoiceProvider } from "./adapters/invoice/stub";
import { MemoryOrderRepository } from "./adapters/repository/memory";

let paymentSingleton: PaymentProvider | undefined;
let deliverySingleton: DeliveryProvider | undefined;
let invoiceSingleton: InvoiceProvider | undefined;
let repositorySingleton: OrderRepository | undefined;

function createPaymentProvider(): PaymentProvider {
  // YeshInvoice is the client's chosen provider, so it is the DEFAULT: unset and
  // the legacy "stub" value both resolve to it. HYP/PayPlus/Cardcom stay
  // selectable for comparison and for a fallback if the clearing setup changes.
  switch (process.env.PAYMENT_PROVIDER) {
    case "hyp":
      return new HypStubPaymentProvider();
    case "payplus":
      return new PayplusStubPaymentProvider();
    case "cardcom":
      return new CardcomStubPaymentProvider();
    case "yeshinvoice":
    case "stub":
    default:
      return new YeshInvoicePaymentProvider();
  }
}

function createInvoiceProvider(): InvoiceProvider {
  switch (process.env.INVOICE_PROVIDER) {
    case "hyp":
      return new HypInvoiceProvider();
    case "stub":
    default:
      return new StubInvoiceProvider();
  }
}

/** The configured payment provider (singleton). */
export function getPaymentProvider(): PaymentProvider {
  if (!paymentSingleton) paymentSingleton = createPaymentProvider();
  return paymentSingleton;
}

/** The configured delivery provider (singleton). Only the stub exists today. */
export function getDeliveryProvider(): DeliveryProvider {
  if (!deliverySingleton) deliverySingleton = new StubDeliveryProvider();
  return deliverySingleton;
}

/** The configured invoice provider (singleton). */
export function getInvoiceProvider(): InvoiceProvider {
  if (!invoiceSingleton) invoiceSingleton = createInvoiceProvider();
  return invoiceSingleton;
}

/**
 * The configured order repository (singleton).
 *
 * Cached on `globalThis` rather than in a plain module variable: Next.js gives
 * each route handler its own module instance (and HMR re-evaluates modules in
 * dev), so a module-level singleton would hand `/api/order/create` and
 * `/api/payment/create` two *different* in-memory stores - the order would be
 * written to one Map and looked up in another, 404-ing every payment. A global
 * cache keeps one store per server process. (A real DB-backed repository makes
 * this moot; the in-memory stub still resets on restart.)
 */
const globalForRepo = globalThis as typeof globalThis & {
  __heumanChefOrderRepo?: OrderRepository;
};

export function getOrderRepository(): OrderRepository {
  if (!globalForRepo.__heumanChefOrderRepo) {
    globalForRepo.__heumanChefOrderRepo =
      repositorySingleton ?? new MemoryOrderRepository();
  }
  repositorySingleton = globalForRepo.__heumanChefOrderRepo;
  return repositorySingleton;
}
