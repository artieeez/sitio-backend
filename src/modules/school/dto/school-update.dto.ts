import { Type } from "class-transformer";
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class SchoolUpdateDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  wixCollectionId?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== "")
  @IsUrl({ require_tld: false })
  url?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== "")
  @IsUrl({ require_tld: false })
  imageUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== "")
  @IsUrl({ require_tld: false })
  faviconUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  active?: boolean;
}
