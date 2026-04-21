import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

/** Body for `POST integrations/wix/media/generate-upload-url` (mirrors Wix REST). */
export class GenerateWixMediaUploadUrlDto {
  @IsString()
  @MaxLength(200)
  mimeType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  filePath?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  parentFolderId?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  private?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sizeInBytes?: number;
}
