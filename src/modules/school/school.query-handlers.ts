import { NotFoundException } from "@nestjs/common";
import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../prisma/prisma.service";
import { mapSchool } from "./school.mapper";
import { GetSchoolQuery, ListSchoolsQuery } from "./school.queries";

@QueryHandler(ListSchoolsQuery)
export class ListSchoolsHandler implements IQueryHandler<ListSchoolsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListSchoolsQuery) {
    const schools = await this.prisma.school.findMany({
      where: query.includeInactive ? {} : { active: true },
      orderBy: { title: "asc" },
    });
    return schools.map(mapSchool);
  }
}

@QueryHandler(GetSchoolQuery)
export class GetSchoolHandler implements IQueryHandler<GetSchoolQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSchoolQuery) {
    const school = await this.prisma.school.findUnique({
      where: { id: query.schoolId },
    });
    if (!school) {
      throw new NotFoundException({
        message: "School not found",
        code: "NOT_FOUND",
      });
    }
    return mapSchool(school);
  }
}
