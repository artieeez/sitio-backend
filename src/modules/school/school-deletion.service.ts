import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { School } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { WixApiService } from "../wix-integration/wix-api.service";

export type SchoolDeactivateEligibilityDto = {
  canDelete: boolean;
  hasWixCollection: boolean;
  /** Set when linked to Wix; 0 means empty collection. */
  productCount: number | null;
  /** Stored id not found in Wix — delete allowed without remote collection delete. */
  wixCollectionMissing?: boolean;
  errorCode?: "WIX_NOT_CONFIGURED" | "WIX_QUERY_FAILED";
};

@Injectable()
export class SchoolDeletionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wixApi: WixApiService,
  ) {}

  async getDeactivateEligibility(
    schoolId: string,
  ): Promise<SchoolDeactivateEligibilityDto> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException({
        message: "School not found",
        code: "NOT_FOUND",
      });
    }
    return this.eligibilityForSchoolRow(school);
  }

  private async eligibilityForSchoolRow(
    school: School,
  ): Promise<SchoolDeactivateEligibilityDto> {
    const wixId = school.wixCollectionId?.trim();
    if (!wixId) {
      return {
        canDelete: true,
        hasWixCollection: false,
        productCount: null,
      };
    }
    try {
      const col = await this.wixApi.getCollectionById(wixId);
      if (!col) {
        return {
          canDelete: true,
          hasWixCollection: true,
          productCount: null,
          wixCollectionMissing: true,
        };
      }
      const n = col.numberOfProducts ?? 0;
      if (n > 0) {
        return {
          canDelete: false,
          hasWixCollection: true,
          productCount: n,
        };
      }
      return {
        canDelete: true,
        hasWixCollection: true,
        productCount: 0,
      };
    } catch (e) {
      if (e instanceof ServiceUnavailableException) {
        return {
          canDelete: false,
          hasWixCollection: true,
          productCount: null,
          errorCode: "WIX_NOT_CONFIGURED",
        };
      }
      return {
        canDelete: false,
        hasWixCollection: true,
        productCount: null,
        errorCode: "WIX_QUERY_FAILED",
      };
    }
  }

  async deactivateSchool(schoolId: string): Promise<void> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException({
        message: "School not found",
        code: "NOT_FOUND",
      });
    }
    const wixId = school.wixCollectionId?.trim();
    if (!wixId) {
      await this.softDeactivate(schoolId);
      return;
    }
    const col = await this.wixApi.getCollectionById(wixId);
    if (col) {
      const n = col.numberOfProducts ?? 0;
      if (n > 0) {
        throw new ConflictException({
          message: "Wix collection still has products",
          code: "WIX_COLLECTION_HAS_PRODUCTS",
          productCount: n,
        });
      }
      try {
        await this.wixApi.deleteCollection(wixId);
      } catch (e) {
        if (e instanceof NotFoundException) {
          // Already removed in Wix; continue deactivating the school row.
        } else {
          throw e;
        }
      }
    }
    await this.softDeactivate(schoolId);
  }

  private async softDeactivate(schoolId: string): Promise<void> {
    await this.prisma.school.update({
      where: { id: schoolId },
      data: { active: false },
    });
  }
}
