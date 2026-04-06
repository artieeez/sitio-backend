import { IsBoolean } from "class-validator";

export class ManualPaidWithoutInfoDto {
  @IsBoolean()
  enabled!: boolean;
}
