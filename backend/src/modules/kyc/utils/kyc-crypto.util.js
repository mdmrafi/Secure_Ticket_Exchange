import crypto from 'crypto';
import { env } from '../../../config/env.config.js';

// Derived 256-bit symmetric encryption key using scrypt
const SALT = 'secure_ticket_exchange_kyc_salt_v1';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a consistent 32-byte key from the configured encryption secret
 * @returns {Buffer}
 */
const getEncryptionKey = () => {
  const secret = env.KYC_ENCRYPTION_KEY || 'super_secret_kyc_aes_gcm_encryption_key_32_bytes_min!';
  return crypto.scryptSync(secret, SALT, 32);
};

/**
 * Encrypt sensitive KYC payload (PII, document data) using AES-256-GCM
 * @param {object|string} data - Data to encrypt
 * @returns {string} Encrypted format: 'iv:authTag:ciphertext' (in hex)
 */
export const encryptKYCData = (data) => {
  if (!data) return null;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const serialized = typeof data === 'string' ? data : JSON.stringify(data);
  let encrypted = cipher.update(serialized, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt sensitive KYC payload using AES-256-GCM
 * @param {string} encryptedString - Format: 'iv:authTag:ciphertext'
 * @returns {object|string|null} Decrypted data
 */
export const decryptKYCData = (encryptedString) => {
  if (!encryptedString || typeof encryptedString !== 'string') return null;

  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted KYC payload format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
};

/**
 * Create a deterministic HMAC-SHA256 hash of a document number
 * Used for duplicate document detection without storing plaintext.
 * @param {string} documentNumber
 * @returns {string} Hex-encoded hash
 */
export const hashDocumentNumber = (documentNumber) => {
  if (!documentNumber) return null;
  const key = getEncryptionKey();
  return crypto
    .createHmac('sha256', key)
    .update(documentNumber.toString().trim().toUpperCase())
    .digest('hex');
};

/**
 * Mask document number for display purposes (never expose full numbers in normal APIs)
 * Example: 'NID-9876543210' -> '******3210' or 'SYN-999-1234' -> 'SYN-***-1234'
 * @param {string} documentNumber
 * @returns {string}
 */
export const maskDocumentNumber = (documentNumber) => {
  if (!documentNumber || typeof documentNumber !== 'string') return '********';
  const trimmed = documentNumber.trim();
  if (trimmed.length <= 4) {
    return '****';
  }
  const lastFour = trimmed.slice(-4);
  return `******${lastFour}`;
};
