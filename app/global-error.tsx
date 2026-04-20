"use client";

/**
 * Global error boundary — last-resort UI when a server or client error
 * escapes every other boundary. Without this file, unhandled React errors
 * during SSR (e.g. rendering an object as a React child) silently become
 * HTTP 500s with zero UX fallback and zero reporting.
 *
 * Also forwards the error to the server for logging via /api/log-error,
 * so we stop flying blind on production crashes.
 */

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Best-effort: forward error to server for logging. Failure is silent
    // (we're already in a bad state, don't cascade).
    try {
      const payload = {
        message: error?.message || "unknown",
        digest: error?.digest,
        stack: error?.stack?.slice(0, 2000),
        url: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        timestamp: new Date().toISOString(),
      };
      fetch("/api/log-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* noop */
    }
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              width: "100%",
              textAlign: "center",
              padding: "2rem",
              background: "white",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)",
            }}
          >
            <h1
              style={{
                fontSize: "3rem",
                margin: "0 0 0.5rem",
                color: "#10b981",
                fontWeight: 800,
              }}
            >
              Oups
            </h1>
            <h2
              style={{
                fontSize: "1.25rem",
                margin: "0 0 1rem",
                color: "#0f172a",
              }}
            >
              Une erreur est survenue
            </h2>
            <p
              style={{
                color: "#64748b",
                margin: "0 0 1.5rem",
                fontSize: "0.95rem",
              }}
            >
              Cette page n&apos;a pas pu s&apos;afficher. Nos équipes ont été
              prévenues automatiquement. Vous pouvez réessayer ou revenir à
              l&apos;accueil.
            </p>
            {error?.digest && (
              <p
                style={{
                  fontSize: "0.7rem",
                  color: "#94a3b8",
                  margin: "0 0 1.5rem",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                ref: {error.digest}
              </p>
            )}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => reset()}
                style={{
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "10px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Réessayer
              </button>
              <a
                href="/"
                style={{
                  background: "white",
                  color: "#0f172a",
                  border: "1px solid #e2e8f0",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "10px",
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.9rem",
                }}
              >
                Accueil
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
