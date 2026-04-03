CREATE TYPE "MediaCategory" AS ENUM ('NATURAL_BEAUTY', 'FRIENDS');

ALTER TABLE "Media"
ADD COLUMN "category" "MediaCategory" NOT NULL DEFAULT 'FRIENDS';

CREATE INDEX "Media_groupId_category_createdAt_idx" ON "Media"("groupId", "category", "createdAt");
