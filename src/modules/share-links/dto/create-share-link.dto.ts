import { IsDateString, IsEnum, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { ShareLinkScopeType } from '@prisma/client';

export class CreateShareLinkDto {
  @IsEnum(ShareLinkScopeType)
  scopeType!: ShareLinkScopeType;

  @ValidateIf((o) => o.scopeType === 'TRIP')
  @IsUUID()
  tripId?: string;

  @ValidateIf((o) => o.scopeType === 'SCHOOL')
  @IsUUID()
  schoolId?: string;

  @IsDateString()
  expiresAt!: string;
}
