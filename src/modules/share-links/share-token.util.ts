import { createHash, randomBytes } from 'crypto';

export function hashShareToken(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}

export function generateShareToken(): string {
  return randomBytes(32).toString('base64url');
}
