import { BadGatewayException, NotFoundException } from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { WixApiService } from "../wix-integration/wix-api.service";
import type { SchoolCreateDto } from "./dto/school-create.dto";
import type { SchoolUpdateDto } from "./dto/school-update.dto";
import {
  CreateSchoolCommand,
  DeactivateSchoolCommand,
  UpdateSchoolCommand,
} from "./school.commands";
import { SchoolDeletionService } from "./school-deletion.service";
import { mapSchool } from "./school.mapper";

function normalizeWixCollectionId(
  v: string | null | undefined,
): string | null {
  if (v === undefined || v === null) return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

/** Wix collection name; keep bounded — catalog APIs may reject very long names. */
const MAX_WIX_COLLECTION_NAME_LEN = 512;

function deriveWixCollectionNameForCreate(dto: SchoolCreateDto): string {
  const title = dto.title?.trim();
  if (title && title.length > 0) {
    return title.slice(0, MAX_WIX_COLLECTION_NAME_LEN);
  }
  return `School-${randomUUID()}`;
}

function deriveWixCollectionNameForUpdate(
  dto: SchoolUpdateDto,
  existingTitle: string | null,
): string {
  const title =
    dto.title !== undefined ? dto.title : existingTitle;
  const t = title?.trim();
  if (t && t.length > 0) {
    return t.slice(0, MAX_WIX_COLLECTION_NAME_LEN);
  }
  return `School-${randomUUID()}`;
}

function mergedDescriptionForWixCollection(
  dtoDescription: SchoolUpdateDto["description"],
  existingDescription: string | null,
): string | undefined {
  const raw =
    dtoDescription !== undefined ? dtoDescription : existingDescription;
  const d = raw?.trim();
  return d && d.length > 0 ? d.slice(0, 8000) : undefined;
}

function wixCollectionIdFromCreatedCollection(
  collection: { id?: string; _id?: string },
): string {
  const id = (collection.id ?? collection._id ?? "").trim();
  if (!id) {
    throw new BadGatewayException(
      "Wix createCollection succeeded but returned no collection id",
    );
  }
  return id;
}

@CommandHandler(CreateSchoolCommand)
export class CreateSchoolHandler
  implements ICommandHandler<CreateSchoolCommand>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly wixApi: WixApiService,
  ) {}

  async execute(command: CreateSchoolCommand) {
    const { dto } = command;
    let wixCollectionId = normalizeWixCollectionId(dto.wixCollectionId);
    if (wixCollectionId === null) {
      const desc = dto.description?.trim();
      const created = await this.wixApi.createCollection({
        collection: {
          name: deriveWixCollectionNameForCreate(dto),
          ...(desc && desc.length > 0
            ? { description: desc.slice(0, 8000) }
            : {}),
        },
      });
      wixCollectionId = wixCollectionIdFromCreatedCollection(
        created.collection,
      );
    }

    const school = await this.prisma.school.create({
      data: {
        wixCollectionId,
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly wixApi: WixApiService,
  ) {}

  async execute(command: UpdateSchoolCommand) {
    const { schoolId, dto } = command;
    const existing = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });
    if (!existing) {
      throw new NotFoundException({
        message: "School not found",
        code: "NOT_FOUND",
      });
    }

    const mergedWix =
      dto.wixCollectionId !== undefined
        ? normalizeWixCollectionId(dto.wixCollectionId)
        : existing.wixCollectionId;

    let wixCollectionId = mergedWix;
    if (wixCollectionId === null) {
      const desc = mergedDescriptionForWixCollection(
        dto.description,
        existing.description,
      );
      const created = await this.wixApi.createCollection({
        collection: {
          name: deriveWixCollectionNameForUpdate(dto, existing.title),
          ...(desc ? { description: desc } : {}),
        },
      });
      wixCollectionId = wixCollectionIdFromCreatedCollection(
        created.collection,
      );
    }

    try {
      const school = await this.prisma.school.update({
        where: { id: schoolId },
        data: {
          ...(dto.wixCollectionId !== undefined || mergedWix === null
            ? { wixCollectionId }
            : {}),
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
  constructor(private readonly schoolDeletion: SchoolDeletionService) {}

  async execute(command: DeactivateSchoolCommand): Promise<void> {
    await this.schoolDeletion.deactivateSchool(command.schoolId);
  }
}
