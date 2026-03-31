import {
  PaymentEntrySource,
  PaymentRecordStatus,
  PrismaClient,
  TripStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.staff.upsert({
    where: { id: 'local-staff-1' },
    update: { username: 'Local Staff' },
    create: { id: 'local-staff-1', username: 'Local Staff' },
  });

  const school = await prisma.school.create({
    data: { name: 'Escola Demo', externalRef: 'demo-school' },
  });
  const trip = await prisma.trip.create({
    data: {
      schoolId: school.id,
      title: 'Viagem Demo',
      status: TripStatus.ACTIVE,
    },
  });
  await prisma.passenger.create({
    data: {
      tripId: trip.id,
      fullName: 'Passageiro Demo',
    },
  });
  await prisma.paymentRecord.create({
    data: {
      entrySource: PaymentEntrySource.INTEGRATION,
      integrationSource: 'sandbox',
      externalPaymentId: 'ext-demo-1',
      tripId: trip.id,
      status: PaymentRecordStatus.UNMATCHED,
    },
  });
  await prisma.paymentRecord.create({
    data: {
      entrySource: PaymentEntrySource.MANUAL_STAFF,
      integrationSource: 'manual',
      externalPaymentId: 'manual-demo-1',
      tripId: trip.id,
      status: PaymentRecordStatus.UNMATCHED,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
