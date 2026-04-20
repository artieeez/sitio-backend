import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";

export class TripUpdateDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  defaultExpectedAmountMinor?: number | null;

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
  @IsBoolean()
  @Type(() => Boolean)
  active?: boolean;
}
