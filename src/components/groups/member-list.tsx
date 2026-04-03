"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Avatar } from "@/components/ui/avatar";

type MemberItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  createdDate: string;
  canDelete: boolean;
};

export function MemberList({ members }: { members: MemberItem[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,250,241,0.68))] p-5 shadow-[0_20px_40px_rgba(45,31,18,0.08)]"
        >
          <div className="flex items-center gap-4">
            <Avatar name={member.name} src={member.avatar} className="h-14 w-14" />
            <div className="min-w-0">
              <h4 className="truncate text-lg font-semibold">{member.name}</h4>
              <p className="truncate text-sm text-[var(--muted)]">{member.email}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="rounded-full border border-[var(--border)] px-3 py-1">{member.role === "admin" ? "Admin" : "Member"}</span>
            <span className="rounded-full border border-[var(--border)] px-3 py-1">Added {member.createdDate}</span>
          </div>

          {member.canDelete ? (
            <button
              type="button"
              disabled={pending && pendingId === member.userId}
              onClick={() =>
                startTransition(async () => {
                  setError("");
                  setPendingId(member.userId);

                  const response = await fetch(`/api/admin/users/${member.userId}`, {
                    method: "DELETE",
                  });

                  const payload = (await response.json()) as { error?: string };
                  if (!response.ok) {
                    setError(payload.error || "Could not delete the user.");
                    setPendingId(null);
                    return;
                  }

                  router.refresh();
                })
              }
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {pending && pendingId === member.userId ? "Deleting..." : "Delete user"}
            </button>
          ) : null}
        </div>
      ))}

      {error ? <p className="md:col-span-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
