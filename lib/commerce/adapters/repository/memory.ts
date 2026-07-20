/**
 * Order repository — in-memory STUB adapter.
 *
 * Backed by a `Map<orderId, Order>` plus a `Map<providerRef, orderId>` reverse
 * index. State is instance-local (so tests can `new MemoryOrderRepository()` for
 * isolation) and RESETS on server restart — fine for the stub; swap for a real
 * DB-backed repository in production.
 *
 * `markPaid` is idempotent: replaying a webhook / VERIFY never double-mutates.
 *
 * 🔒 ORDER IDS ARE UNGUESSABLE (`ord_` + a v4 UUID), not sequential.
 * This is a security requirement, not cosmetics. Our payment provider
 * (YeshInvoice) posts an UNSIGNED webhook: anyone who can reach
 * `/api/payment/callback` can POST `UniqueID=<order id>`. With sequential ids
 * (`ord_1`, `ord_2`, …) an attacker could enumerate and forge "order N is paid"
 * for every order on the site. A 122-bit random id makes the order id itself an
 * unguessable capability, so a forged notify has nothing to aim at. Keep this
 * property in any real DB-backed repository that replaces this stub — do NOT use
 * an auto-increment primary key as the public order id.
 */

import { randomUUID } from "node:crypto";

import type { OrderRepository } from "../../ports/repository";
import type { NewOrder, Order } from "../../types";

export class MemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();
  private readonly refIndex = new Map<string, string>();

  async create(o: NewOrder): Promise<Order> {
    // Node-only (`node:crypto`) — repositories run server-side only.
    const id = `ord_${randomUUID()}`;
    const order: Order = {
      ...o,
      id,
      status: "pending",
      createdAtISO: new Date().toISOString(),
    };
    this.orders.set(id, order);
    return order;
  }

  async get(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async update(id: string, patch: Partial<Order>): Promise<Order> {
    const existing = this.orders.get(id);
    if (!existing) throw new Error(`Order not found: ${id}`);
    // Guard: id is immutable regardless of what the patch contains.
    const updated: Order = { ...existing, ...patch, id: existing.id };
    this.orders.set(id, updated);
    if (patch.providerRef) this.refIndex.set(patch.providerRef, id);
    return updated;
  }

  async findByProviderRef(ref: string): Promise<Order | null> {
    const id = this.refIndex.get(ref);
    return id ? this.orders.get(id) ?? null : null;
  }

  async markPaid(id: string, providerRef: string): Promise<Order> {
    const existing = this.orders.get(id);
    if (!existing) throw new Error(`Order not found: ${id}`);
    // Idempotent: already paid → return unchanged (no re-fulfil, no overwrite).
    if (existing.status === "paid") return existing;
    const updated: Order = { ...existing, status: "paid", providerRef };
    this.orders.set(id, updated);
    this.refIndex.set(providerRef, id);
    return updated;
  }
}
