-- DropTable
DROP TABLE IF EXISTS "school_wix_integrations";

-- CreateTable (tenant-wide singleton: only row id = 1 is used)
CREATE TABLE "wix_integrations" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "public_key" TEXT,
    "private_api_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wix_integrations_pkey" PRIMARY KEY ("id")
);
