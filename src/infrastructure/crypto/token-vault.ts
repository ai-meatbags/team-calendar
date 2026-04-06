import crypto from 'node:crypto';
import type { TokenVaultPort } from '@/ports/security';

const TOKEN_PARTS_COUNT = 3;

function parseTokenEncKey(raw: string | undefined) {
  if (!raw) return null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  try {
    const key = Buffer.from(raw, 'base64');
    return key.length === 32 ? key : null;
  } catch {
    return null;
  }
}

export function createTokenVault(tokenEncKey: string | undefined): TokenVaultPort {
  const key = parseTokenEncKey(tokenEncKey);
  if (!key) {
    throw new Error('TOKEN_ENC_KEY must be set to a valid 32-byte key (base64 or 64-hex)');
  }

  const isEncrypted = (value: string | null | undefined) => {
    if (!value) return false;
    return String(value).split('.').length === TOKEN_PARTS_COUNT;
  };

  const encrypt = (value: string) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
      iv.toString('base64url'),
      tag.toString('base64url'),
      encrypted.toString('base64url')
    ].join('.');
  };

  const decrypt = (value: string | null | undefined) => {
    if (!value) return null;
    const parts = String(value).split('.');
    if (parts.length !== TOKEN_PARTS_COUNT) {
      return value;
    }

    try {
      const [ivB64, tagB64, dataB64] = parts;
      const iv = Buffer.from(ivB64, 'base64url');
      const tag = Buffer.from(tagB64, 'base64url');
      const data = Buffer.from(dataB64, 'base64url');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
      return decrypted.toString('utf8');
    } catch {
      return null;
    }
  };

  return {
    encrypt,
    decrypt,
    isEncrypted
  };
}
