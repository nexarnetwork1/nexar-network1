"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/monitoring/sentry";
import { ATLAS_ASSETS, ATLAS_BRAND } from "@/config/atlas-branding";

/**
 * Root error boundary — cannot rely on app chrome / CSS modules.
 * Inline styles keep ATLAS branding even when the layout tree fails.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { digest: error.digest, boundary: "global" });
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
          background: "#050608",
          color: "#ffffff",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          padding: "24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            borderRadius: 12,
            border: "1px solid rgba(255, 209, 92, 0.14)",
            background: "#111111",
            padding: 32,
            textAlign: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ATLAS_ASSETS.logoPrimary}
            alt={`${ATLAS_BRAND.name} by NEXAR NETWORK`}
            width={180}
            height={48}
            style={{ height: 48, width: "auto", margin: "0 auto 20px" }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 12,
              letterSpacing: "0.2em",
              color: "rgba(255, 209, 92, 0.7)",
              fontFamily: "ui-monospace, Menlo, Consolas, monospace",
            }}
          >
            ERROR
          </p>
          <h1 style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 600, color: "#ffffff" }}>
            Something went wrong
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.6, color: "#8b949e" }}>
            A critical error occurred. The issue has been logged. You can retry, reload, or return
            home.
          </p>
          {error.digest && (
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 12,
                color: "rgba(122, 122, 122, 0.7)",
                fontFamily: "ui-monospace, Menlo, Consolas, monospace",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              type="button"
              onClick={reset}
              style={{
                height: 44,
                borderRadius: 10,
                border: "1px solid rgba(255, 209, 92, 0.5)",
                background: "#FFD15C",
                color: "#050608",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                height: 44,
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "transparent",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Reload page
            </button>
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 44,
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Return home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
