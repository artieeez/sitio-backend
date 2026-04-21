import { IsOptional, IsString, MaxLength } from "class-validator";

export class PatchWixIntegrationDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  siteId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8192)
  publicKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8192)
  privateApiKey?: string;
}
