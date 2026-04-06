import { IsInt, IsNotEmpty, IsString, Matches, Min } from "class-validator";

/** All fields required; `passengerId` is not mutable (OpenAPI). */
export class PaymentUpdateDto {
  @IsInt()
  @Min(0)
  amountMinor!: number;

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
