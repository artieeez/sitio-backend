import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { PatchWixIntegrationDto } from "./dto/patch-wix-integration.dto";

export type WixIntegrationSettingsResponse = {
  publicKeyPrefix: string | null;
  privateApiKeyPrefix: string | null;
};

/** Single row for the whole tenant (see Prisma model `WixIntegration`). */
const WIX_INTEGRATION_SINGLETON_ID = 1;

function keyPrefix(value: string | null | undefined): string | null {
  if (value == null || value.length === 0) return null;
  return value.slice(0, 4);
}

function normalizeKeyInput(value: string): string | null {
  const t = value.trim();
  return t.length === 0 ? null : t;
}

@Injectable()
export class WixIntegrationService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<WixIntegrationSettingsResponse> {
    const row = await this.prisma.wixIntegration.findUnique({
      where: { id: WIX_INTEGRATION_SINGLETON_ID },
    });
    if (!row) {
      return { publicKeyPrefix: null, privateApiKeyPrefix: null };
    }
    return {
      publicKeyPrefix: keyPrefix(row.publicKey),
      privateApiKeyPrefix: keyPrefix(row.privateApiKey),
    };
  }

  async patchSettings(
    dto: PatchWixIntegrationDto,
  ): Promise<WixIntegrationSettingsResponse> {
    const update: {
      publicKey?: string | null;
      privateApiKey?: string | null;
    } = {};
    if (dto.publicKey !== undefined) {
      update.publicKey = normalizeKeyInput(dto.publicKey);
    }
    if (dto.privateApiKey !== undefined) {
      update.privateApiKey = normalizeKeyInput(dto.privateApiKey);
    }

    if (Object.keys(update).length === 0) {
      return this.getSettings();
    }

    await this.prisma.wixIntegration.upsert({
      where: { id: WIX_INTEGRATION_SINGLETON_ID },
      create: {
        id: WIX_INTEGRATION_SINGLETON_ID,
        publicKey:
          dto.publicKey !== undefined ? normalizeKeyInput(dto.publicKey) : null,
        privateApiKey:
          dto.privateApiKey !== undefined
            ? normalizeKeyInput(dto.privateApiKey)
            : null,
      },
      update,
    });

    return this.getSettings();
  }
}
