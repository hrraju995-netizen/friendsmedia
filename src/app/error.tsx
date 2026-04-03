"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error("Vercel Server Component Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-8 text-center page-shell">
      <div className="glass-card max-w-md rounded-[32px] p-8 shadow-xl">
        <h2 className="font-serif text-3xl font-semibold text-red-600">Server Error</h2>
        <p className="mt-4 text-sm text-[var(--muted)]">
          An unexpected error occurred while loading this page. This is usually caused by a database timeout or a missing environment API token on Vercel. 
        </p>
        <div className="mt-4 p-4 rounded-xl bg-white/50 border border-[var(--border)] text-left overflow-x-auto">
             <p className="text-xs text-black/60 font-mono break-words">{error.message || "No inner error details provided by Next.js in production."}</p>
        </div>
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
