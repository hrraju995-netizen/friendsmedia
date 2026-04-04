import Image from "next/image";
import Link from "next/link";
import { Images, LockKeyhole, Smartphone } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  let isSignedIn = false;
  let hasUsers = true;
  let serviceWarning = "";

  try {
    const session = await auth();
    isSignedIn = Boolean(session?.user);
  } catch (error) {
    console.error("Home page auth check failed:", error);
    serviceWarning = "We could not verify your current session right now. You can still continue to sign in manually.";
  }

  try {
    hasUsers = (await prisma.user.count()) > 0;
  } catch (error) {
    console.error("Home page user count failed:", error);
    hasUsers = true;
    serviceWarning =
      "The home page could not reach the production database just now. Please check Vercel environment variables, database access, and Prisma migrations.";
  }

  const primaryHref = isSignedIn ? "/gallery" : hasUsers ? "/login" : "/register";
  const primaryLabel = isSignedIn ? "Open dashboard" : hasUsers ? "Sign in" : "Create first admin";
  const secondaryHref = isSignedIn ? "/moments" : "/login";
  const secondaryLabel = isSignedIn ? "View moments" : "Member sign in";

  return (
    <main className="page-shell">
      <section className="relative overflow-hidden">
        {/* Glow behind the hero */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top,rgba(216,170,87,0.2),transparent_60%)]" />
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-12 lg:py-16">
          {/* Main Card */}
          <div className="glass-card animate-fade-in-up overflow-hidden rounded-[40px] border border-[var(--border)]">
            <div className="grid gap-10 bg-[linear-gradient(135deg,rgba(253,251,247,0.7),rgba(250,245,235,0.3))] px-6 py-8 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:py-10">
              <div className="flex flex-col justify-between gap-8 animate-fade-in-up delay-100">
                <div className="space-y-6">
                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--forest)] shadow-sm backdrop-blur-sm">
                      Private Shared Gallery
                    </span>
                    <span className="rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-xs font-medium text-[var(--accent)] shadow-sm backdrop-blur-sm">
                      Photo, video, profile, download
                    </span>
                  </div>

                  <div className="space-y-4">
                    <h1 className="text-gradient-vibrant max-w-2xl font-serif text-[clamp(2.5rem,5.2vw,4.4rem)] font-semibold leading-[0.98] tracking-[-0.03em] pb-2">
                      A quieter home for your family&apos;s photos and shared memories.
                    </h1>
                    <p className="max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
                      Friends Media is designed for close circles, not noisy public feeds. Keep every moment inside one private space
                      where your people can upload together, open images beautifully, and download the memories they want to keep.
                    </p>
                    {serviceWarning ? (
                      <div className="max-w-2xl rounded-[24px] border border-[rgba(177,85,42,0.18)] bg-[rgba(255,255,255,0.8)] px-5 py-4 text-sm leading-7 text-[var(--foreground)] shadow-sm">
                        {serviceWarning}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap gap-4 mt-2">
                  <Link
                    href={primaryHref}
                    className="rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] px-8 py-4 font-medium text-white shadow-[0_18px_36px_rgba(177,85,42,0.25)] transition hover:scale-[1.03] active:scale-95"
                  >
                    {primaryLabel}
                  </Link>
                  <Link
                     href={secondaryHref}
                     className="glass-card rounded-full px-8 py-4 font-medium transition hover:border-[var(--forest)] hover:text-[var(--forest)] hover:-translate-y-1 active:scale-95"
                   >
                     {secondaryLabel}
                   </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 mt-4">
                  <div className="glass-card group rounded-[28px] p-5 hover:-translate-y-2">
                    <span className="inline-flex rounded-full bg-[rgba(43,91,77,0.1)] p-3 text-[var(--forest)] transition-colors duration-300 group-hover:bg-[var(--forest)] group-hover:text-white">
                      <LockKeyhole className="h-5 w-5" />
                    </span>
                    <p className="mt-4 text-xl font-semibold">Private by default</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">Only approved members can browse, upload, stream, and download.</p>
                  </div>
                  <div className="glass-card group rounded-[28px] p-5 hover:-translate-y-2 delay-100">
                    <span className="inline-flex rounded-full bg-[rgba(216,170,87,0.12)] p-3 text-[#c28100] transition-colors duration-300 group-hover:bg-[#c28100] group-hover:text-white">
                      <Images className="h-5 w-5" />
                    </span>
                    <p className="mt-4 text-xl font-semibold">Shared timeline</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">One viewer for photos and videos, with uploader profiles.</p>
                  </div>
                  <div className="glass-card group rounded-[28px] p-5 hover:-translate-y-2 delay-200">
                    <span className="inline-flex rounded-full bg-[rgba(177,85,42,0.1)] p-3 text-[var(--accent)] transition-colors duration-300 group-hover:bg-[var(--accent)] group-hover:text-white">
                      <Smartphone className="h-5 w-5" />
                    </span>
                    <p className="mt-4 text-xl font-semibold">Feels like an app</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">Install it on your phone and jump straight into moments.</p>
                  </div>
                </div>
              </div>

              {/* Right side visual */}
              <div className="relative flex items-center justify-center animate-fade-in-up delay-200 mt-8 lg:mt-0">
                <div className="absolute inset-0 rounded-[36px] bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(217,119,6,0.1),transparent_35%)] transform rotate-3" />
                <div className="relative w-full max-w-[780px] group perspective-1000">
                  <div className="absolute -left-3 top-8 hidden rounded-[26px] glass-card p-4 shadow-2xl transition-all duration-500 group-hover:-translate-y-4 group-hover:-translate-x-2 lg:block z-10">
                    <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-[var(--forest)] font-bold">Shared Viewer</p>
                    <p className="mt-2 max-w-[12rem] text-sm leading-6 text-[var(--muted)]">
                      Full-size preview, uploader identity, and quick download in one calm modal.
                    </p>
                  </div>
                  <div className="absolute -right-3 bottom-12 hidden rounded-[26px] glass-card border border-[var(--border)] p-4 text-[var(--foreground)] shadow-2xl transition-all duration-500 group-hover:translate-y-4 group-hover:translate-x-2 lg:block z-10 backdrop-blur-md">
                    <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-[var(--accent)] font-bold">Admin Flow</p>
                    <p className="mt-2 max-w-[13rem] text-sm leading-6 text-[var(--muted)]">
                      Create member accounts once, then let everyone add memories into one private timeline.
                    </p>
                  </div>

                  <Image
                    src="/home-hero-visual.svg"
                    alt="Friends Media collage showing shared photo cards, private gallery viewer, and app-style media layout."
                    width={900}
                    height={820}
                    priority
                    className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.02] filter drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3 animate-fade-in-up delay-300">
            <div className="glass-card rounded-[30px] p-8 transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">For Admins</p>
              <h2 className="mt-3 font-serif text-[2rem] font-semibold leading-tight text-gradient-vibrant">Set up once</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Add people manually, connect one shared Drive account, and keep every memory inside the same trusted home.
              </p>
            </div>
            <div className="glass-card rounded-[30px] p-8 transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl delay-100">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">For Members</p>
              <h2 className="mt-3 font-serif text-[2rem] font-semibold leading-tight text-gradient-vibrant">Upload together</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Send many images at once, open them in a centered popup viewer, and manage your own uploads with ease.
              </p>
            </div>
            <div className="glass-card rounded-[30px] p-8 transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl delay-200">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">For Phones</p>
              <h2 className="mt-3 font-serif text-[2rem] font-semibold leading-tight text-gradient-vibrant">App experience</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Install Friends Media on the home screen and open it straight into dashboard, moments, upload, and profile.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
