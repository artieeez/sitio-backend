import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { PassengersModule } from './modules/passengers/passengers.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { ShareLinksModule } from './modules/share-links/share-links.module';
import { TripsModule } from './modules/trips/trips.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SchoolsModule,
    TripsModule,
    PassengersModule,
    ShareLinksModule,
    ReconciliationModule,
    PaymentsModule,
  ],
})
export class AppModule {}
