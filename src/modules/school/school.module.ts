import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { PrismaModule } from "../../prisma/prisma.module";
import { WixIntegrationModule } from "../wix-integration/wix-integration.module";
import {
  CreateSchoolHandler,
  DeactivateSchoolHandler,
  UpdateSchoolHandler,
} from "./school.command-handlers";
import { SchoolController } from "./school.controller";
import { GetSchoolHandler, ListSchoolsHandler } from "./school.query-handlers";

@Module({
  imports: [CqrsModule, PrismaModule, WixIntegrationModule],
  controllers: [SchoolController],
  providers: [
    CreateSchoolHandler,
    UpdateSchoolHandler,
    DeactivateSchoolHandler,
    ListSchoolsHandler,
    GetSchoolHandler,
  ],
})
export class SchoolModule {}
