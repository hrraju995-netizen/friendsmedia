ALTER TABLE "Media"
ALTER COLUMN "category" DROP DEFAULT;

ALTER TABLE "Media"
ALTER COLUMN "category" TYPE TEXT USING "category"::text;

DROP TYPE IF EXISTS "MediaCategory";
