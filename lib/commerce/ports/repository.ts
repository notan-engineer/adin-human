/**
 * Order repository port — persistence for orders, independent of the backing
 * store (in-memory Map for the stub; Postgres/Prisma/etc. later).
 */

import type { NewOrder, Order } from "../types";

export interface OrderRepository {
  /** Persist a new order; assigns id, `status: "pending"`, `createdAtISO`. */
  create(o: NewOrder): Promise<Order>;

  /** Fetch by id, or `null` if none. */
  get(id: string): Promise<Order | null>;

  /** Shallow-merge `patch` into the stored order and return the result. */
  update(id: string, patch: Partial<Order>): Promise<Order>;

  /** Reverse-lookup by the payment provider's reference, or `null`. */
  findByProviderRef(ref: string): Promise<Order | null>;

  /**
   * Mark an order paid and record its `providerRef`. MUST be idempotent: if the
   * order is already `"paid"`, return the existing order unchanged (so a webhook
   * retry or a double VERIFY never corrupts state or double-fulfils).
   */
  markPaid(id: string, providerRef: string): Promise<Order>;
}
