import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const sharedGroupName = "Friends Media";
const sharedGroupSlug = "friends-media";

async function main() {
  const password = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@friendsmedia.app" },
    update: {
      role: "super_admin",
    },
    create: {
      email: "demo@friendsmedia.app",
      name: "Demo User",
      password,
      role: "super_admin",
    },
  });

  const group = await prisma.group.upsert({
    where: { slug: sharedGroupSlug },
    update: {
      name: sharedGroupName,
    },
    create: {
      name: sharedGroupName,
      slug: sharedGroupSlug,
    },
  });

  await prisma.groupMember.upsert({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: user.id,
      },
    },
    update: { role: "admin" },
    create: {
      groupId: group.id,
      userId: user.id,
      role: "admin",
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
