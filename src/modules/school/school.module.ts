import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { PrismaModule } from "../../prisma/prisma.module";
import {
  CreateSchoolHandler,
  DeactivateSchoolHandler,
  UpdateSchoolHandler,
} from "./school.command-handlers";
import { SchoolController } from "./school.controller";
import { GetSchoolHandler, ListSchoolsHandler } from "./school.query-handlers";

@Module({
  imports: [CqrsModule, PrismaModule],
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
