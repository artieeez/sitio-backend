-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "favicon_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "url" TEXT,
    "title" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "favicon_url" TEXT,
    "default_expected_amount_minor" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passengers" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "cpf_normalized" TEXT,
    "parent_name" TEXT,
    "parent_phone_number" TEXT,
    "parent_email" TEXT,
    "expected_amount_override_minor" INTEGER,
    "manual_paid_without_info" BOOLEAN NOT NULL DEFAULT false,
    "removed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passengers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "passenger_id" UUID NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "paid_on" DATE NOT NULL,
    "location" TEXT NOT NULL,
    "payer_identity" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trips_school_id_idx" ON "trips"("school_id");

-- CreateIndex
CREATE INDEX "passengers_trip_id_idx" ON "passengers"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "passenger_trip_cpf_unique" ON "passengers"("trip_id", "cpf_normalized");

-- CreateIndex
CREATE INDEX "payments_passenger_id_idx" ON "payments"("passenger_id");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_passenger_id_fkey" FOREIGN KEY ("passenger_id") REFERENCES "passengers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
