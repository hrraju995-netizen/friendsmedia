"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDevelopment = process.env.NODE_ENV !== "production";

  useEffect(() => {
    console.error("Friends Media global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-8 text-center page-shell">
      <div className="glass-card max-w-md rounded-[32px] p-8 shadow-xl">
        <h2 className="font-serif text-3xl font-semibold text-red-600">Server Error</h2>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Something went wrong while opening this screen or finishing your request. Please try again. If this happened during an upload,
          the selected file may still be too large for the current server limit.
        </p>
        {isDevelopment ? (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-white/50 p-4 text-left overflow-x-auto">
            <p className="text-xs font-mono text-black/60 break-words">
              {error.message || "No inner error details provided by Next.js in development."}
            </p>
          </div>
        ) : null}
        <button
          onClick={() => reset()}
          className="mt-6 rounded-full bg-[var(--forest)] px-8 py-3 font-medium text-white transition hover:bg-teal-800"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
