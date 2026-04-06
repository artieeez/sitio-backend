-- Copy legacy display label into title when missing, then drop redundant name column.
UPDATE "schools" SET "title" = COALESCE(NULLIF(TRIM("title"), ''), "name");

ALTER TABLE "schools" DROP COLUMN "name";
