import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import type { PatchWixIntegrationDto } from "./dto/patch-wix-integration.dto";

export type WixIntegrationSettingsResponse = {
  /** Wix site GUID; sent as `wix-site-id` on API calls when `WIX_SITE_ID` is not set in env. */
  siteId: string | null;
  /** Full value for webhook verification setup (not masked). */
  publicKey: string | null;
  /** Private key is never returned in full; first 10 characters for recognition. */
  privateApiKeyPrefix: string | null;
};

/** Single row for the whole tenant (see Prisma model `WixIntegration`). */
const WIX_INTEGRATION_SINGLETON_ID = 1;

const PRIVATE_KEY_PREFIX_LEN = 10;

function keyPrefix(value: string | null | undefined): string | null {
  if (value == null || value.length === 0) return null;
  return value.slice(0, PRIVATE_KEY_PREFIX_LEN);
}

function normalizeKeyInput(value: string): string | null {
  const t = value.trim();
  return t.length === 0 ? null : t;
}

function normalizeSiteId(value: string): string | null {
  const t = value.trim();
  return t.length === 0 ? null : t;
}

@Injectable()
export class WixIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Resolves the Wix site id for REST calls (`wix-site-id` header).
   * Prefer `WIX_SITE_ID` in env when set; otherwise the DB value from settings.
   */
  async resolveSiteId(): Promise<string | null> {
    const fromEnv = this.config.get<string>("WIX_SITE_ID")?.trim();
    if (fromEnv && fromEnv.length > 0) {
      return fromEnv;
    }
    const row = await this.prisma.wixIntegration.findUnique({
      where: { id: WIX_INTEGRATION_SINGLETON_ID },
    });
    const fromDb = row?.siteId?.trim();
    return fromDb && fromDb.length > 0 ? fromDb : null;
  }

  /**
   * Resolves the secret used for Wix REST calls (`WixApiService`).
   * Prefer `WIX_PRIVATE_API_KEY` in env when set; otherwise the DB value from settings.
   */
  async resolvePrivateApiKey(): Promise<string | null> {
    const fromEnv = this.config.get<string>("WIX_PRIVATE_API_KEY")?.trim();
    if (fromEnv && fromEnv.length > 0) {
      return fromEnv;
    }
    const row = await this.prisma.wixIntegration.findUnique({
      where: { id: WIX_INTEGRATION_SINGLETON_ID },
    });
    const fromDb = row?.privateApiKey?.trim();
    return fromDb && fromDb.length > 0 ? fromDb : null;
  }

  async getSettings(): Promise<WixIntegrationSettingsResponse> {
    const row = await this.prisma.wixIntegration.findUnique({
      where: { id: WIX_INTEGRATION_SINGLETON_ID },
    });
    if (!row) {
      return { siteId: null, publicKey: null, privateApiKeyPrefix: null };
    }
    return {
      siteId: row.siteId?.trim() ? row.siteId.trim() : null,
      publicKey: row.publicKey?.trim() ? row.publicKey.trim() : null,
      privateApiKeyPrefix: keyPrefix(row.privateApiKey),
    };
  }

  async patchSettings(
    dto: PatchWixIntegrationDto,
  ): Promise<WixIntegrationSettingsResponse> {
    const update: {
      siteId?: string | null;
      publicKey?: string | null;
      privateApiKey?: string | null;
    } = {};
    if (dto.siteId !== undefined) {
      update.siteId = normalizeSiteId(dto.siteId);
    }
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
        siteId: dto.siteId !== undefined ? normalizeSiteId(dto.siteId) : null,
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
