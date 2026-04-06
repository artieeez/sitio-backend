import { NotFoundException } from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateSchoolCommand,
  DeactivateSchoolCommand,
  UpdateSchoolCommand,
} from "./school.commands";
import { mapSchool } from "./school.mapper";

@CommandHandler(CreateSchoolCommand)
export class CreateSchoolHandler
  implements ICommandHandler<CreateSchoolCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateSchoolCommand) {
    const { dto } = command;
    const school = await this.prisma.school.create({
      data: {
        url: dto.url ?? null,
        title: dto.title ?? null,
        description: dto.description ?? null,
        imageUrl: dto.imageUrl ?? null,
        faviconUrl: dto.faviconUrl ?? null,
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });
    return mapSchool(school);
  }
}

@CommandHandler(UpdateSchoolCommand)
export class UpdateSchoolHandler
  implements ICommandHandler<UpdateSchoolCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateSchoolCommand) {
    const { schoolId, dto } = command;
    try {
      const school = await this.prisma.school.update({
        where: { id: schoolId },
        data: {
          ...(dto.url !== undefined && { url: dto.url }),
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
          ...(dto.faviconUrl !== undefined && { faviconUrl: dto.faviconUrl }),
          ...(dto.active !== undefined && { active: dto.active }),
        },
      });
      return mapSchool(school);
    } catch {
      throw new NotFoundException({
        message: "School not found",
        code: "NOT_FOUND",
      });
    }
  }
}

@CommandHandler(DeactivateSchoolCommand)
export class DeactivateSchoolHandler
  implements ICommandHandler<DeactivateSchoolCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeactivateSchoolCommand): Promise<void> {
    const { schoolId } = command;
    try {
      await this.prisma.school.update({
        where: { id: schoolId },
        data: { active: false },
      });
    } catch {
      throw new NotFoundException({
        message: "School not found",
        code: "NOT_FOUND",
      });
    }
  }
}
