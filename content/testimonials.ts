/**
 * ⚠️ PLACEHOLDER DATA — FOR REVIEW.
 * These are INVENTED reviews written to dress the layout. The names, quotes and
 * ratings are NOT real customer feedback and MUST be replaced with genuine,
 * attributable reviews before launch — publishing fabricated testimonials is
 * both misleading and, in most markets, unlawful.
 *
 * Only structure lives here — names and quotes are localized in
 * `messages/{he,en}.json` under the `testimonials` namespace, keyed by `id`.
 */

export type TestimonialId = "yael" | "noam" | "tamar";

export type Testimonial = {
  id: TestimonialId;
  /** Whole stars out of 5. */
  rating: number;
};

export const testimonials: Testimonial[] = [
  { id: "yael", rating: 5 },
  { id: "noam", rating: 5 },
  { id: "tamar", rating: 5 },
];
