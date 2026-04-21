-- Rename column (was misnamed "app id"; value is the Wix site GUID for wix-site-id)
ALTER TABLE "wix_integrations" RENAME COLUMN "app_id" TO "site_id";
