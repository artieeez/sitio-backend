import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";

export class PassengerUpdateDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fullName?: string;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== "")
  @IsString()
  @MaxLength(20)
  cpf?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  parentName?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== "")
  @IsString()
  @MaxLength(40)
  parentPhoneNumber?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== "")
  @IsEmail()
  @MaxLength(320)
  parentEmail?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  expectedAmountOverrideMinor?: number | null;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  confirmNameDuplicate?: boolean;

  /** When true, soft-remove; when false, restore. Omitted leaves unchanged. */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  removed?: boolean;
}
