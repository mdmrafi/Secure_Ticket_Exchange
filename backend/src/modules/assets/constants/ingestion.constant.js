/**
 * Document Ingestion & Extraction Processing States
 */
export const ExtractionStatus = Object.freeze({
  UPLOADED: 'UPLOADED',
  PROCESSING: 'PROCESSING',
  EXTRACTED: 'EXTRACTED',
  FAILED: 'FAILED',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
});

/**
 * File upload validation constraints
 */
export const FileSecurityConstraints = Object.freeze({
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5 Megabytes
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
  PROHIBITED_EXTENSIONS: [
    '.exe',
    '.bat',
    '.cmd',
    '.sh',
    '.bin',
    '.js',
    '.vbs',
    '.msi',
    '.com',
    '.scr',
    '.ps1',
    '.py',
    '.php',
    '.pl',
    '.jar',
    '.dll',
    '.sys',
  ],
});
