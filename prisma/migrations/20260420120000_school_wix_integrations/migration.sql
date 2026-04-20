-- CreateTable
CREATE TABLE "school_wix_integrations" (
    "school_id" UUID NOT NULL,
    "public_key" TEXT,
    "private_api_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_wix_integrations_pkey" PRIMARY KEY ("school_id")
);

-- AddForeignKey
ALTER TABLE "school_wix_integrations" ADD CONSTRAINT "school_wix_integrations_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
