"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Root layout failure boundary — must render its own html/body.
 * Keeps customers on a branded recovery path instead of a raw framework error.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        scope: "global_error",
        message: error.message,
        digest: error.digest,
      }),
    );
    Sentry.captureException(error, { extra: { digest: error.digest, boundary: "global" } });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, 'Times New Roman', serif",
          background: "linear-gradient(180deg, #faf7f2 0%, #f3eee6 100%)",
          color: "#14532d",
        }}
      >
        <main style={{ maxWidth: 420, padding: "2rem", textAlign: "center" }}>
          <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 12, color: "#b45309" }}>
            Something went wrong
          </p>
          <h1 style={{ fontSize: "1.75rem", margin: "0.75rem 0" }}>We hit an unexpected error</h1>
          <p style={{ lineHeight: 1.6, color: "#166534" }}>
            Please try again. If this continues, email info@beyondbabyco.com and we will help right away.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                border: 0,
                borderRadius: 999,
                padding: "0.75rem 1.25rem",
                background: "#166534",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.assign("/");
              }}
              style={{
                borderRadius: 999,
                padding: "0.75rem 1.25rem",
                border: "1px solid #166534",
                background: "transparent",
                color: "#166534",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Back to home
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
