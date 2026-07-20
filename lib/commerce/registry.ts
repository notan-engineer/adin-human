/**
 * Provider registry — the single place the app resolves which adapter backs each
 * port. Selection is env-driven; everything else in the app depends only on the
 * PORT interfaces, so switching providers is a one-line env / registry change.
 *
 * Providers are module-level singletons (lazy). The in-memory repository is a
 * singleton on purpose so all callers share the same store within a process.
 *
 *   PAYMENT_PROVIDER   hyp | payplus | cardcom   (default: hyp stub; "stub" ⇒ hyp)
 *   DELIVERY_PROVIDER  stub                       (default: stub)
 *   INVOICE_PROVIDER   stub | hyp                 (default: stub)
 *   ORDER_REPOSITORY   memory                     (default: memory)
 */

import type { PaymentProvider } from "./ports/payment";
import type { DeliveryProvider } from "./ports/delivery";
import type { InvoiceProvider } from "./ports/invoice";
import type { OrderRepository } from "./ports/repository";

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
  // "stub" and undefined both fall through to the HYP stub (the client's choice).
  switch (process.env.PAYMENT_PROVIDER) {
    case "payplus":
      return new PayplusStubPaymentProvider();
    case "cardcom":
      return new CardcomStubPaymentProvider();
    case "hyp":
    case "stub":
    default:
      return new HypStubPaymentProvider();
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

/** The configured order repository (singleton). Only in-memory exists today. */
export function getOrderRepository(): OrderRepository {
  if (!repositorySingleton) repositorySingleton = new MemoryOrderRepository();
  return repositorySingleton;
}
