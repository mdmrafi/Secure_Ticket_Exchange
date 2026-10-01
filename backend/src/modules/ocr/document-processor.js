import { getOCRProvider } from './providers/ocr-provider.factory.js';
import { RailwayTicketParser } from './parsers/railway-ticket.parser.js';
import { ExtractionStatus } from '../assets/constants/ingestion.constant.js';
import { AssetTypes } from '../../common/constants/asset-types.constant.js';
import { logger } from '../../config/logger.config.js';

/**
 * DocumentProcessor
 *
 * Coordinates document text extraction, parser dispatch,
 * validation, and state determination.
 *
 * DocumentProcessor
 *     ↓
 * OCRProvider
 */
export class DocumentProcessor {
  constructor(ocrProviderFactory = getOCRProvider) {
    this.getOCRProvider = ocrProviderFactory;
  }

  /**
   * Process an uploaded ticket document through the OCR pipeline
   *
   * @param {object} params
   * @param {string|Buffer} params.fileInput - File path or buffer
   * @param {string} [params.mimeType]
   * @param {string} [params.originalFilename]
   * @param {string} [params.assetType='RAILWAY_TICKET']
   * @param {object} [params.options]
   */
  async processDocument({
    fileInput,
    mimeType,
    originalFilename,
    assetType = AssetTypes.RAILWAY_TICKET,
    options = {},
  }) {
    logger.info(
      { assetType, originalFilename, mimeType },
      '[DocumentProcessor] Dispatching document to OCR pipeline'
    );

    // 1. Resolve OCR Provider
    const provider = this.getOCRProvider(options.ocrProvider || 'mock');

    // 2. Perform raw text extraction via OCRProvider
    const ocrResult = await provider.extractText(fileInput, {
      mimeType,
      originalFilename,
      ...options,
    });

    const rawText = ocrResult.rawText || '';
    const ocrConfidence = ocrResult.confidence || 0;

    // 3. Dispatch to type-specific field parser
    let extractedFields = {};
    if (assetType === AssetTypes.RAILWAY_TICKET) {
      extractedFields = RailwayTicketParser.parse(rawText);
    } else {
      // Generic fallback parser
      extractedFields = { rawSnippet: rawText.slice(0, 200) };
    }

    // 4. Determine processing status based on confidence and critical field presence
    let extractionStatus = ExtractionStatus.PROCESSING;
    let processingNotes = '';

    const hasCriticalRailwayFields =
      Boolean(extractedFields.pnr || extractedFields.ticketNumber) &&
      Boolean(extractedFields.source || extractedFields.destination || extractedFields.trainName);

    if (ocrConfidence < 30 || !rawText || ocrResult.metadata?.ocrOutcome === 'FAILED') {
      extractionStatus = ExtractionStatus.FAILED;
      processingNotes = 'OCR extraction failed: document text unreadable or degraded.';
    } else if (
      ocrConfidence < 75 ||
      !hasCriticalRailwayFields ||
      ocrResult.metadata?.ocrOutcome === 'NEEDS_REVIEW'
    ) {
      extractionStatus = ExtractionStatus.NEEDS_REVIEW;
      processingNotes =
        'Partial OCR extraction: critical travel fields incomplete or borderline confidence.';
    } else {
      extractionStatus = ExtractionStatus.EXTRACTED;
      processingNotes = 'Document successfully processed and structured fields extracted.';
    }

    logger.info(
      { extractionStatus, ocrConfidence, provider: provider.getName() },
      '[DocumentProcessor] OCR extraction completed'
    );

    return {
      extractionStatus,
      ocrConfidence,
      extractedFields,
      rawText,
      provider: provider.getName(),
      processingNotes,
      extractedAt: new Date(),
    };
  }
}

export const documentProcessor = new DocumentProcessor();
