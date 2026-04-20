import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MetadataModule } from "./modules/metadata/metadata.module";
import { PassengerModule } from "./modules/passenger/passenger.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { SchoolModule } from "./modules/school/school.module";
import { TripModule } from "./modules/trip/trip.module";
import { WixIntegrationModule } from "./modules/wix-integration/wix-integration.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CqrsModule.forRoot(),
    PrismaModule,
    MetadataModule,
    SchoolModule,
    TripModule,
    PassengerModule,
    PaymentModule,
    WixIntegrationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
