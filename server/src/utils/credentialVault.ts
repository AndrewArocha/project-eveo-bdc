import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

function encryptionKey() {
  const key = Buffer.from(env.integrationEncryptionKey, 'hex');
  if (!/^[a-f\d]{64}$/i.test(env.integrationEncryptionKey) || key.length !== 32) {
    throw new AppError(503, 'Set INTEGRATION_ENCRYPTION_KEY to a random 32-byte hex key before storing integration credentials.', 'CREDENTIAL_VAULT_NOT_CONFIGURED');
  }
  return key;
}

export function encryptCredentials(credentials: Record<string, string>) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(credentials), 'utf8'), cipher.final()]);
  return { version: 1, iv: iv.toString('base64url'), authTag: cipher.getAuthTag().toString('base64url'), ciphertext: ciphertext.toString('base64url') };
}

export function decryptCredentials(secret: { version: number; iv: string; authTag: string; ciphertext: string }) {
  if (secret.version !== 1) throw new AppError(500, 'Unsupported stored credential format.', 'CREDENTIAL_FORMAT_UNSUPPORTED');
  try {
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(secret.iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(secret.authTag, 'base64url'));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(secret.ciphertext, 'base64url')), decipher.final()]).toString('utf8');
    return JSON.parse(plaintext) as Record<string, string>;
  } catch {
    throw new AppError(500, 'Stored integration credentials could not be decrypted.', 'CREDENTIAL_DECRYPTION_FAILED');
  }
}
