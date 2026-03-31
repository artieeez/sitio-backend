import { IsOptional, IsString, MinLength } from 'class-validator';

export class ManualPassengerDto {
  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsOptional()
  @IsString()
  studentDocument?: string;
}
