import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const mediaResult = await prisma.media.deleteMany();
  console.log(`Successfully deleted ${mediaResult.count} old media records from the database!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
