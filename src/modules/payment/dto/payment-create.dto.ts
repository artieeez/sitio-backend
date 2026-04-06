import { IsInt, IsNotEmpty, IsString, Matches, Min } from "class-validator";

export class PaymentCreateDto {
  @IsInt()
  @Min(0)
  amountMinor!: number;

  /** Date-only `YYYY-MM-DD` (America/Sao_Paulo calendar date per contract). */
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  paidOn!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsString()
  @IsNotEmpty()
  payerIdentity!: string;
}
