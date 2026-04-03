export function AppBootScreen() {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center px-6 py-12">
      <div className="glass-card w-full max-w-xl rounded-[32px] p-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,var(--forest),#183b31)] shadow-[0_22px_45px_rgba(20,34,29,0.22)]">
          <div className="relative h-10 w-10">
            <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/90" />
            <span className="absolute left-1/2 top-0 h-10 w-1.5 -translate-x-1/2 rounded-full bg-[var(--gold)]" />
          </div>
        </div>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.34em] text-[var(--muted)]">Friends Media</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">Opening your private gallery</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Getting your dashboard, shared moments, and profile tools ready.
        </p>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/60">
          <div className="h-full w-1/2 rounded-full bg-[linear-gradient(90deg,var(--accent),var(--gold),var(--forest))] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
