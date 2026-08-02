/**
 * Client-safe shipping constants and helpers.
 *
 * This module is imported by BOTH client components (for instant display —
 * regular shipping is a flat nationwide fee, so no quote round-trip is needed
 * to show it) and the server delivery adapter (the authority at order time).
 * Keep it dependency-free: client code must never import the delivery stub.
 *
 * All amounts are INTEGER AGOROT.
 */

/** Regular ("courier") delivery — flat nationwide. */
export const COURIER_FEE_AGOROT = 4_000;

/**
 * Orders at/above this merchandise total ship free by courier. Evaluated
 * against the DISCOUNTED (bundle-priced) subtotal — the amount actually paid
 * for goods — on both client and server.
 */
export const FREE_SHIPPING_THRESHOLD_AGOROT = 40_000;

/** The courier fee for a given merchandise total: flat, or 0 at the threshold. */
export function courierFeeAgorot(merchandiseAgorot: number): number {
  return merchandiseAgorot >= FREE_SHIPPING_THRESHOLD_AGOROT
    ? 0
    : COURIER_FEE_AGOROT;
}
