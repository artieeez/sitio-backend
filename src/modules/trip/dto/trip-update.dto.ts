import { Type } from "class-transformer";
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class TripUpdateDto {
  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== "")
  @IsUrl({ require_tld: false })
  url?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== "")
  @IsUrl({ require_tld: false })
  imageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  active?: boolean;
}
