import Link from "next/link";

import { AdminCreateUserForm } from "@/components/groups/admin-create-user-form";
import { AdminCategoryManager } from "@/components/categories/admin-category-manager";
import { MemberList } from "@/components/groups/member-list";
import { UserNav } from "@/components/layout/user-nav";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { getAvatarSrc } from "@/lib/avatar";
import { requireAuth } from "@/lib/auth";
import { SHARED_GROUP_SLUG, isSuperAdmin } from "@/lib/community";
import { MEDIA_CATEGORIES_CONFIG_KEY, parseMediaCategoriesValue } from "@/lib/media-categories";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const user = await requireAuth();
  const sharedMembership = user.memberships.find((membership) => membership.group.slug === SHARED_GROUP_SLUG) ?? user.memberships[0] ?? null;
  const userIsSuperAdmin = isSuperAdmin(user.role);

  const [mediaCount, memberCount, members, categoryConfig] = await Promise.all([
    sharedMembership
      ? prisma.media.count({
          where: {
            groupId: sharedMembership.groupId,
            deletedAt: null,
          },
        })
      : 0,
    sharedMembership
      ? prisma.groupMember.count({
          where: {
            groupId: sharedMembership.groupId,
          },
        })
      : user.memberships.length,
    userIsSuperAdmin && sharedMembership
      ? prisma.groupMember.findMany({
          where: {
            groupId: sharedMembership.groupId,
          },
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      : [],
    prisma.appConfig.findUnique({
      where: { key: MEDIA_CATEGORIES_CONFIG_KEY },
    }),
  ]);
  const categories = parseMediaCategoriesValue(categoryConfig?.value);

  return (
    <main className="page-shell px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="animate-fade-in-up">
          <UserNav
            userName={user.name || user.email || "Friends Media Member"}
            userImage={getAvatarSrc(user.id, user.image)}
            userRole={user.role}
          />
        </div>

        <section className="glass-card animate-fade-in-up delay-100 overflow-hidden rounded-[36px] border border-[var(--border)] shadow-2xl">
          <div className="grid gap-8 bg-[linear-gradient(135deg,rgba(253,251,247,0.7),rgba(250,245,235,0.3))] p-8 lg:grid-cols-[1.25fr_0.75fr] lg:p-10 relative">
            <div className="absolute top-0 right-1/2 w-64 h-64 bg-[var(--gold)] opacity-10 blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--forest)] opacity-10 blur-[80px] pointer-events-none" />

            <div className="space-y-7 relative z-10">
              <div className="space-y-3">
                <p className="inline-flex rounded-full border border-[var(--border)] bg-white/70 backdrop-blur-md px-4 py-1 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--forest)] shadow-sm">
                  Private Dashboard
                </p>
                <div>
                  <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl text-gradient-vibrant pb-1">
                    Welcome back, {user.name?.split(" ")[0] || "friend"}
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--muted)]">
                    {userIsSuperAdmin
                      ? "Create accounts, connect storage, and keep the whole shared space organized from one calm control panel."
                      : "Everything you need starts here. Browse everyone's moments, upload new memories, or update your profile in one place."}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="glass-card rounded-[26px] p-5 hover:-translate-y-1 transition-transform">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Your role</p>
                  <p className="mt-3 text-xl font-semibold text-gradient">{userIsSuperAdmin ? "Main admin" : "Member"}</p>
                </div>
                <div className="glass-card rounded-[26px] p-5 hover:-translate-y-1 transition-transform delay-100">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Shared members</p>
                  <p className="mt-3 text-xl font-semibold text-gradient">{memberCount}</p>
                </div>
                <div className="glass-card rounded-[26px] p-5 hover:-translate-y-1 transition-transform delay-200">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Moments saved</p>
                  <p className="mt-3 text-xl font-semibold text-gradient">{mediaCount}</p>
                </div>
              </div>

              {!sharedMembership ? (
                <div className="rounded-[24px] border border-[var(--border)] bg-white/60 p-5 text-sm leading-7 text-[var(--muted)]">
                  The shared space is not ready yet. Sign out and back in after the main admin finishes setup.
                </div>
              ) : null}
            </div>

            <div className="rounded-[32px] bg-gradient-to-br from-[var(--forest)] to-[#142e26] border border-[rgba(255,255,255,0.15)] p-6 text-white shadow-[0_26px_60px_rgba(20,34,29,0.36)] relative z-10 transition-transform hover:scale-[1.01] duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 blur-[60px] pointer-events-none" />
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/70">Quick Start</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold">Jump straight in</h2>
              <div className="mt-6 grid gap-3">
                <Link
                  href="/moments"
                  className="rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-sm px-5 py-4 transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5"
                >
                  <p className="text-lg font-semibold">Moments</p>
                  <p className="mt-1 text-sm text-white/70">See photos and videos from everyone.</p>
                </Link>
                <Link
                  href="/upload"
                  className="rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-sm px-5 py-4 transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5"
                >
                  <p className="text-lg font-semibold">Upload</p>
                  <p className="mt-1 text-sm text-white/70">Add many images or videos in one go.</p>
                </Link>
                <Link
                  href="/profile"
                  className="rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-sm px-5 py-4 transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5"
                >
                  <p className="text-lg font-semibold">Profile</p>
                  <p className="mt-1 text-sm text-white/70">Change your name, password, and photo.</p>
                </Link>
                <div className="opacity-95 hover:opacity-100 transition-opacity">
                  <InstallAppButton />
                </div>
                {userIsSuperAdmin ? (
                  <a
                    href="/api/google/connect"
                    className="rounded-[24px] bg-gradient-to-r from-[var(--gold)] to-[#b8862d] px-5 py-4 text-[var(--foreground)] transition-all hover:brightness-110 hover:-translate-y-0.5 shadow-lg"
                  >
                    <p className="text-lg font-semibold">Connect Drive</p>
                    <p className="mt-1 text-sm text-white/80 font-medium">Finish storage setup for everyone.</p>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {userIsSuperAdmin ? (
          <>
            <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr] animate-fade-in-up delay-200">
              <div className="glass-card rounded-[32px] p-8 hover:shadow-2xl transition-shadow">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">Create Account</p>
                  <h3 className="mt-3 font-serif text-3xl font-semibold text-gradient">Add a new member</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                    Create the login once, then they can change password and profile photo from their own profile page.
                  </p>
                </div>

                {sharedMembership ? <AdminCreateUserForm /> : null}
              </div>

              <div className="glass-card rounded-[32px] p-8 hover:shadow-2xl transition-shadow">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">Upload Categories</p>
                  <h3 className="mt-3 font-serif text-3xl font-semibold text-gradient">Control upload sections</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                    Add the categories people will choose from before uploading. Remove only categories that are not used yet.
                  </p>
                </div>

                <div className="mt-6">
                  <AdminCategoryManager categories={categories} />
                </div>
              </div>
            </section>

            <section className="glass-card rounded-[32px] p-8 hover:shadow-2xl transition-shadow animate-fade-in-up delay-300">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">Members</p>
                <h3 className="mt-3 font-serif text-3xl font-semibold text-gradient-vibrant">People in the space</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Everyone you add appears here. You can remove accounts anytime from this list.
                </p>
              </div>
                <div className="rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-sm font-medium shadow-sm">
                  {memberCount} total
                </div>
            </div>

            <div className="mt-8">
              {members.length === 0 ? (
                <div className="rounded-[24px] border border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted)]">
                  No extra users yet. Create the first member from the form on the left.
                </div>
              ) : (
                <MemberList
                  members={members.map((member) => ({
                    id: member.id,
                    userId: member.user.id,
                    name: member.user.name || member.user.email || "Friends Media Member",
                    email: member.user.email || "",
                    role: member.role,
                    avatar: getAvatarSrc(member.user.id, member.user.image),
                    createdDate: member.user.createdAt.toISOString().slice(0, 10),
                    canDelete: member.user.id !== user.id,
                  }))}
                />
              )}
            </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
