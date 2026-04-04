import { UserNav } from "@/components/layout/user-nav";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { getAvatarSrc } from "@/lib/avatar";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireAuth();
  const displayName = user.name || user.email || "Friends Media Member";

  return (
    <main className="page-shell px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="animate-fade-in-up">
          <UserNav
            userName={displayName}
            userImage={getAvatarSrc(user.id, user.image)}
            userRole={user.role}
          />
        </div>

        <div className="animate-fade-in-up delay-100 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)] to-[var(--forest)] opacity-5 blur-[120px] pointer-events-none rounded-full" />
          <div className="relative z-10 glass-card rounded-[32px] p-6 sm:p-10 shadow-2xl">
            <ProfileSettingsForm
              currentName={displayName}
              currentAvatar={getAvatarSrc(user.id, user.image)}
              email={user.email || ""}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
