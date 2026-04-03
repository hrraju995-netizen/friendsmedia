import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isSuperAdmin } from "@/lib/community";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        include: {
          group: true,
        },
      },
    },
  });
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAuth();

  if (!isSuperAdmin(user.role)) {
    redirect("/gallery");
  }

  return user;
}

export async function requireGroupMember(groupId: string) {
  const user = await requireAuth();
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    throw new Error("You do not have access to this group.");
  }

  return { user, membership };
}
