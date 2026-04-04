import { redirect } from "next/navigation";

import { UserNav } from "@/components/layout/user-nav";
import { UploadForm } from "@/components/media/upload-form";
import { getAvatarSrc } from "@/lib/avatar";
import { SHARED_GROUP_SLUG } from "@/lib/community";
import { MEDIA_CATEGORIES_CONFIG_KEY, parseMediaCategoriesValue } from "@/lib/media-categories";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export default async function UploadPage() {
  const user = await requireAuth();

  if (user.memberships.length === 0) {
    redirect("/gallery");
  }

  const sharedMembership = user.memberships.find((membership) => membership.group.slug === SHARED_GROUP_SLUG) ?? user.memberships[0];

  if (!sharedMembership) {
    redirect("/gallery");
  }

  const categoryConfig = await prisma.appConfig.findUnique({
    where: { key: MEDIA_CATEGORIES_CONFIG_KEY },
  });
  const categories = parseMediaCategoriesValue(categoryConfig?.value);

  return (
    <main className="page-shell px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 sm:gap-8">
        <div className="animate-fade-in-up">
          <UserNav
            userName={user.name || user.email || "Friends Media Member"}
            userImage={getAvatarSrc(user.id, user.image)}
            userRole={user.role}
          />
        </div>
        <div className="animate-fade-in-up delay-100 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--forest)] to-transparent opacity-5 blur-[100px] pointer-events-none rounded-full" />
          <div className="relative z-10 glass-card rounded-[32px] p-3 sm:p-6 md:p-10 shadow-2xl">
            <UploadForm group={{ id: sharedMembership.groupId, name: sharedMembership.group.name }} categories={categories} />
          </div>
        </div>
      </div>
    </main>
  );
}
