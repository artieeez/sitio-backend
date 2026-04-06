/** Brazilian CPF: digits only in persistence; validate check digits when non-empty. */

export function stripCpfDigits(input: string): string {
  return input.replace(/\D/g, "");
}

export function isValidCpfDigits(digits: string): boolean {
  if (digits.length !== 11) {
    return false;
  }
  if (/^(\d)\1{10}$/.test(digits)) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(digits[i]) * (10 - i);
  }
  let d1 = (sum * 10) % 11;
  if (d1 === 10) {
    d1 = 0;
  }
  if (d1 !== Number(digits[9])) {
    return false;
  }
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(digits[i]) * (11 - i);
  }
  let d2 = (sum * 10) % 11;
  if (d2 === 10) {
    d2 = 0;
  }
  return d2 === Number(digits[10]);
}

export function normalizeCpfInput(
  cpf: string | null | undefined,
): string | null {
  if (cpf == null || cpf === "") {
    return null;
  }
  const digits = stripCpfDigits(cpf);
  if (digits.length === 0) {
    return null;
  }
  if (!isValidCpfDigits(digits)) {
    throw new CpfValidationError();
  }
  return digits;
}

export class CpfValidationError extends Error {
  constructor() {
    super("Invalid CPF");
    this.name = "CpfValidationError";
  }
}

export function formatCpfDisplay(digits: string): string {
  if (digits.length !== 11) {
    return digits;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
