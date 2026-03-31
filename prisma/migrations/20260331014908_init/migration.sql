-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PassengerPaymentStatus" AS ENUM ('PAID', 'PENDING', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "PassengerDocumentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'SUBMITTED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "PassengerCreatedVia" AS ENUM ('IMPORT_FILE', 'MANUAL_FORM', 'FROM_PAYMENT');

-- CreateEnum
CREATE TYPE "PassengerLifecycle" AS ENUM ('ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "PaymentEntrySource" AS ENUM ('INTEGRATION', 'MANUAL_STAFF');

-- CreateEnum
CREATE TYPE "PaymentRecordStatus" AS ENUM ('UNMATCHED', 'MATCHED', 'VERIFIED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "PaymentAuditEventType" AS ENUM ('VERIFIED', 'MATCHED', 'REASSIGNED', 'UNMATCHED', 'FLAGGED', 'UNFLAGGED', 'PASSENGER_CREATED_FROM_PAYMENT');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('INTERNAL_USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ShareLinkScopeType" AS ENUM ('TRIP', 'SCHOOL');

-- CreateEnum
CREATE TYPE "FlagTargetType" AS ENUM ('PASSENGER', 'PAYMENT_RECORD');

-- CreateEnum
CREATE TYPE "FlagStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "externalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "status" "TripStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passenger" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "studentDocument" TEXT,
    "paymentStatus" "PassengerPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "documentStatus" "PassengerDocumentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "createdVia" "PassengerCreatedVia",
    "lifecycle" "PassengerLifecycle" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Passenger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "entrySource" "PaymentEntrySource" NOT NULL,
    "integrationSource" TEXT NOT NULL,
    "externalPaymentId" TEXT NOT NULL,
    "tripId" TEXT,
    "rawPayload" JSONB,
    "amount" DECIMAL(18,2),
    "currency" TEXT,
    "paymentDate" TIMESTAMP(3),
    "status" "PaymentRecordStatus" NOT NULL DEFAULT 'UNMATCHED',
    "matchedPassengerId" TEXT,
    "verifiedByUserId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "suspectedDuplicateOf" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAuditEvent" (
    "id" TEXT NOT NULL,
    "paymentRecordId" TEXT NOT NULL,
    "eventType" "PaymentAuditEventType" NOT NULL,
    "actorType" "AuditActorType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "fromPassengerId" TEXT,
    "toPassengerId" TEXT,
    "reason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "PaymentAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scopeType" "ShareLinkScopeType" NOT NULL,
    "tripId" TEXT,
    "schoolId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flag" (
    "id" TEXT NOT NULL,
    "targetType" "FlagTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "FlagStatus" NOT NULL DEFAULT 'OPEN',
    "createdByUserId" TEXT NOT NULL,
    "resolvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Flag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_externalRef_key" ON "School"("externalRef");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_code_key" ON "Trip"("code");

-- CreateIndex
CREATE INDEX "PaymentRecord_tripId_idx" ON "PaymentRecord"("tripId");

-- CreateIndex
CREATE INDEX "PaymentRecord_status_idx" ON "PaymentRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_integrationSource_externalPaymentId_key" ON "PaymentRecord"("integrationSource", "externalPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_tokenHash_key" ON "ShareLink"("tokenHash");

-- CreateIndex
CREATE INDEX "Flag_targetType_targetId_idx" ON "Flag"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passenger" ADD CONSTRAINT "Passenger_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_matchedPassengerId_fkey" FOREIGN KEY ("matchedPassengerId") REFERENCES "Passenger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_suspectedDuplicateOf_fkey" FOREIGN KEY ("suspectedDuplicateOf") REFERENCES "PaymentRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAuditEvent" ADD CONSTRAINT "PaymentAuditEvent_paymentRecordId_fkey" FOREIGN KEY ("paymentRecordId") REFERENCES "PaymentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
