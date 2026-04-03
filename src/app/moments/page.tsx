import { UserNav } from "@/components/layout/user-nav";
import { UserFilteredMoments } from "@/components/media/user-filtered-moments";
import { getAvatarSrc } from "@/lib/avatar";
import { requireAuth } from "@/lib/auth";
import { SHARED_GROUP_SLUG } from "@/lib/community";
import { prisma } from "@/lib/prisma";

export default async function MomentsPage() {
  const user = await requireAuth();
  const sharedMembership = user.memberships.find((membership) => membership.group.slug === SHARED_GROUP_SLUG) ?? user.memberships[0] ?? null;

  const media = sharedMembership
    ? await prisma.media.findMany({
        where: {
          groupId: sharedMembership.groupId,
          deletedAt: null,
        },
        include: {
          uploader: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 48,
      })
    : [];

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

        <section className="glass-card animate-fade-in-up delay-100 rounded-[32px] p-8 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[var(--gold)] opacity-5 blur-[100px] pointer-events-none" />
          
          <div className="max-w-3xl relative z-10">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">Moments</p>
            <h1 className="mt-3 font-serif text-[2.5rem] leading-tight font-semibold text-gradient-vibrant">Moments from everyone</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Browse every photo and video shared by the whole circle in one clean page. Open any card to view it large and download it.
            </p>
          </div>

          <div className="mt-10 relative z-10 animate-fade-in-up delay-200">
            {media.length === 0 ? (
              <div className="rounded-[24px] border border-[var(--border)] bg-white/70 backdrop-blur-md p-8 text-center text-sm text-[var(--muted)] shadow-sm">
                Nothing uploaded yet. Use the upload page after the main admin connects Google Drive.
              </div>
            ) : (
              <UserFilteredMoments
                items={media.map((item) => ({
                  id: item.id,
                  fileName: item.fileName,
                  mediaType: item.mediaType,
                  category: item.category,
                  uploaderId: item.uploaderId,
                  uploaderName: item.uploader.name || item.uploader.email || "Friends Media Member",
                  uploaderAvatar: getAvatarSrc(item.uploader.id, item.uploader.image),
                  canDelete: item.uploaderId === user.id,
                }))}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
