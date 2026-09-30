import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { BadRequestError } from '../errors/index.js';
import { FileSecurityConstraints } from '../../modules/assets/constants/ingestion.constant.js';
import { logger } from '../../config/logger.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Secure private storage directory outside public web root
export const TICKET_UPLOAD_DIR = path.resolve(__dirname, '../../../storage/uploads/tickets');

// Ensure directory exists with proper permissions
if (!fs.existsSync(TICKET_UPLOAD_DIR)) {
  fs.mkdirSync(TICKET_UPLOAD_DIR, { recursive: true });
}

/**
 * Configure secure disk storage
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TICKET_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate secure randomized filename to prevent directory traversal & collisions
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedExt = FileSecurityConstraints.ALLOWED_EXTENSIONS.includes(ext) ? ext : '.bin';
    const uniqueName = `ticket_${Date.now()}_${crypto.randomUUID()}${sanitizedExt}`;
    cb(null, uniqueName);
  },
});

/**
 * Validate file metadata, extension, and MIME type
 */
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // 1. Strict executable file rejection
  if (FileSecurityConstraints.PROHIBITED_EXTENSIONS.includes(ext)) {
    return cb(
      new BadRequestError(
        `Security restriction: Executable and script files (${ext}) are strictly prohibited.`
      ),
      false
    );
  }

  // 2. Allowed extension check
  if (!FileSecurityConstraints.ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new BadRequestError(
        `Invalid file type '${ext}'. Allowed file types: ${FileSecurityConstraints.ALLOWED_EXTENSIONS.join(', ')}`
      ),
      false
    );
  }

  // 3. Allowed MIME type check
  if (!FileSecurityConstraints.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new BadRequestError(
        `Invalid MIME type '${file.mimetype}'. Only images (JPEG, PNG, WEBP) and PDFs are accepted.`
      ),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: FileSecurityConstraints.MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter,
});

/**
 * Verify magic bytes of the uploaded file to prevent MIME-spoofing
 * @param {string} filePath
 * @param {string} expectedMimeType
 * @returns {boolean}
 */
export const verifyFileMagicBytes = (filePath, expectedMimeType) => {
  try {
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    // JPEG signature: FF D8 FF
    if (expectedMimeType === 'image/jpeg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (expectedMimeType === 'image/png') {
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    }

    // PDF signature: %PDF- (25 50 44 46)
    if (expectedMimeType === 'application/pdf') {
      return (
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46
      );
    }

    // WEBP signature: RIFF....WEBP
    if (expectedMimeType === 'image/webp') {
      const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
      const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP';
      return isRiff && isWebp;
    }

    return false;
  } catch (err) {
    logger.error({ err, filePath }, 'Failed to read file magic bytes');
    return false;
  }
};

/**
 * Express middleware for ticket document upload with comprehensive security checks
 * Field name: 'ticket' (also accepts 'document' or 'file')
 */
export const ticketUploadMiddleware = (req, res, next) => {
  const uploadHandler = upload.fields([
    { name: 'ticket', maxCount: 1 },
    { name: 'document', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]);

  uploadHandler(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new BadRequestError(
              `File is too large. Maximum allowed size is ${FileSecurityConstraints.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`
            )
          );
        }
        return next(new BadRequestError(`Upload error: ${err.message}`));
      }
      return next(err);
    }

    // Extract the uploaded file from whichever field was provided
    const file =
      req.files?.ticket?.[0] ||
      req.files?.document?.[0] ||
      req.files?.file?.[0] ||
      req.file;

    if (!file) {
      return next(new BadRequestError('Please provide a ticket file to upload (field: ticket, document, or file).'));
    }

    // Validate magic bytes to guard against renamed malicious files
    const isValidSignature = verifyFileMagicBytes(file.path, file.mimetype);
    if (!isValidSignature) {
      // Immediately delete malicious / corrupted file
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkErr) {
        logger.error({ unlinkErr }, 'Failed to remove invalid file');
      }

      return next(
        new BadRequestError(
          'Corrupted or malicious file rejected: file header signature does not match declared image/PDF type.'
        )
      );
    }

    req.uploadedTicketFile = file;
    next();
  });
};
