-- Drop legacy landing URL; trips are sourced from Wix catalog products.
ALTER TABLE "trips" DROP COLUMN IF EXISTS "url";

ALTER TABLE "trips" ADD COLUMN "wix_product_id" TEXT;
ALTER TABLE "trips" ADD COLUMN "wix_product_slug" TEXT;
ALTER TABLE "trips" ADD COLUMN "wix_product_page_url" TEXT;
