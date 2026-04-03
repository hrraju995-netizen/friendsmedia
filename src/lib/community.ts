import type { Prisma, PrismaClient } from "@prisma/client";

export const SHARED_GROUP_NAME = "Friends Media";
export const SHARED_GROUP_SLUG = "friends-media";

type GroupClient = Prisma.TransactionClient | PrismaClient;

export async function ensureSharedGroup(db: GroupClient) {
  return db.group.upsert({
    where: { slug: SHARED_GROUP_SLUG },
    update: {},
    create: {
      name: SHARED_GROUP_NAME,
      slug: SHARED_GROUP_SLUG,
    },
  });
}

export function isSuperAdmin(role: string | null | undefined) {
  return role === "super_admin";
}
