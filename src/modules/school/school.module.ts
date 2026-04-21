import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { PrismaModule } from "../../prisma/prisma.module";
import { WixIntegrationModule } from "../wix-integration/wix-integration.module";
import {
  ActivateSchoolHandler,
  CreateSchoolHandler,
  DeactivateSchoolHandler,
  DeleteSchoolHandler,
  UpdateSchoolHandler,
} from "./school.command-handlers";
import { SchoolDeletionService } from "./school-deletion.service";
import { SchoolController } from "./school.controller";
import { GetSchoolHandler, ListSchoolsHandler } from "./school.query-handlers";

@Module({
  imports: [CqrsModule, PrismaModule, WixIntegrationModule],
  controllers: [SchoolController],
  providers: [
    SchoolDeletionService,
    CreateSchoolHandler,
    UpdateSchoolHandler,
    DeactivateSchoolHandler,
    ActivateSchoolHandler,
    DeleteSchoolHandler,
    ListSchoolsHandler,
    GetSchoolHandler,
  ],
})
export class SchoolModule {}
