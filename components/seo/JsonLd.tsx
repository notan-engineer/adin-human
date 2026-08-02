/**
 * Renders structured data as a `<script type="application/ld+json">`.
 *
 * Server Component only - this ships zero client JS. The payload is built from
 * our own trusted content modules (never user input), and `<` is escaped so a
 * string value can't terminate the script element early.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
