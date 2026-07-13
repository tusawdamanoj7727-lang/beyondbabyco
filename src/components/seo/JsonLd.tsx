type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[] | null;
};

/** Recursively omit null/undefined keys so Google JSON-LD parsers avoid empty fields. */
export function stripJsonLdUndefined(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.map(stripJsonLdUndefined).filter((entry) => entry !== undefined);
  }
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = stripJsonLdUndefined(entry);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    }
    return result;
  }
  return value;
}

export default function JsonLd({ data }: JsonLdProps) {
  if (!data) return null;
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((item, index) => {
        const cleaned = stripJsonLdUndefined(item);
        if (!cleaned || typeof cleaned !== "object") return null;
        return (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(cleaned) }}
          />
        );
      })}
    </>
  );
}
