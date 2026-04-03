-- AddColumn
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'member';

-- Promote the earliest existing user to the main admin role.
UPDATE "User"
SET "role" = 'super_admin'
WHERE "id" = (
  SELECT "id"
  FROM "User"
  ORDER BY "createdAt" ASC, "id" ASC
  LIMIT 1
);

-- Ensure the shared gallery group exists.
INSERT INTO "Group" ("id", "name", "slug", "createdAt", "updatedAt")
SELECT
  'shared-group-' || substr(md5(random()::text || clock_timestamp()::text), 1, 24),
  'Friends Media',
  'friends-media',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "Group"
  WHERE "slug" = 'friends-media'
);

-- Ensure every existing user belongs to the shared gallery group.
WITH shared_group AS (
  SELECT "id"
  FROM "Group"
  WHERE "slug" = 'friends-media'
  LIMIT 1
)
INSERT INTO "GroupMember" ("id", "groupId", "userId", "role", "createdAt")
SELECT
  'shared-member-' || substr(md5(random()::text || clock_timestamp()::text || u."id"), 1, 24),
  sg."id",
  u."id",
  CASE
    WHEN u."role" = 'super_admin' THEN 'admin'
    ELSE 'member'
  END,
  CURRENT_TIMESTAMP
FROM "User" u
CROSS JOIN shared_group sg
WHERE NOT EXISTS (
  SELECT 1
  FROM "GroupMember" gm
  WHERE gm."groupId" = sg."id" AND gm."userId" = u."id"
);
