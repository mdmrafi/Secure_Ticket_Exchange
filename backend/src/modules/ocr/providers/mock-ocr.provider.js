import fs from 'fs';
import { OCRProvider } from './ocr-provider.interface.js';
import { logger } from '../../../config/logger.config.js';

/**
 * MockOCRProvider
 *
 * High-fidelity local mock OCR engine for development and synthetic testing.
 * Accurately extracts textual information from synthetic railway tickets
 * without relying on external cloud APIs or native system binary dependencies.
 */
export class MockOCRProvider extends OCRProvider {
  constructor() {
    super();
    this.name = 'mock-local-ocr';
  }

  getName() {
    return this.name;
  }

  /**
   * Extract text from synthetic ticket document
   */
  async extractText(fileInput, options = {}) {
    const filename = (options.originalFilename || (typeof fileInput === 'string' ? fileInput : '')).toUpperCase();
    const isExplicitFail = options.testFailure || filename.includes('FAIL') || filename.includes('CORRUPT') || filename.includes('UNREADABLE');
    const isExplicitReview = options.testReview || filename.includes('REVIEW') || filename.includes('BORDERLINE') || filename.includes('BLUR');

    logger.info(
      { filename, isExplicitFail, isExplicitReview },
      '[MockOCRProvider] Processing document OCR extraction'
    );

    // Read file buffer if path was provided
    let fileContent = '';
    if (typeof fileInput === 'string' && fs.existsSync(fileInput)) {
      try {
        const raw = fs.readFileSync(fileInput, 'utf8');
        // If file has text embedded (like a text-based synthetic PDF/test file), check for custom markers
        fileContent = raw;
      } catch {
        // Binary image, fallback to synthetic evaluation
      }
    }

    // 1. Simulating Unreadable/Corrupted OCR Failure
    if (isExplicitFail || fileContent.includes('SIMULATE_OCR_FAILURE')) {
      return {
        rawText: '??? %$#@! BLURRED ARTIFACT - NO READABLE TEXT DETECTED ???',
        confidence: 12.5,
        blocks: [
          { text: '??? %$#@!', confidence: 10 },
          { text: 'BLURRED ARTIFACT', confidence: 15 },
        ],
        metadata: {
          engine: this.name,
          version: '1.0.0',
          pageCount: 1,
          isDegraded: true,
          ocrOutcome: 'FAILED',
        },
      };
    }

    // 2. Simulating Borderline / Needs Review OCR
    if (isExplicitReview || fileContent.includes('SIMULATE_OCR_REVIEW')) {
      const partialText = `
BANGLADESH RAILWAY
E-TICKET
PNR: PNR-REV-9871
Train: Suborno Express
From: DHAKA  To: [ILLEGIBLE_INK_BLOT]
Date: 2026-10-20
Coach: ??  Seat: ??
Fare: 1250.00
Passenger: T. Ahmed
      `.trim();

      return {
        rawText: partialText,
        confidence: 58.0,
        blocks: partialText.split('\n').map((line) => ({ text: line.trim(), confidence: 58 })),
        metadata: {
          engine: this.name,
          version: '1.0.0',
          pageCount: 1,
          isDegraded: true,
          ocrOutcome: 'NEEDS_REVIEW',
        },
      };
    }

    // 3. Standard High-Fidelity Synthetic Railway Ticket OCR Extraction
    // Generates realistic synthetic Bangladeshi railway e-ticket format
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const pnr = options.mockPnr || `PNR${randomSuffix}7654`;
    const ticketNo = options.mockTicketNumber || `BR-2026-${randomSuffix}99`;

    const standardTicketText = `
============================================================
              BANGLADESH RAILWAY
           ELECTRONIC TRAVEL TICKET
============================================================
Ticket No: ${ticketNo}
PNR Number: ${pnr}
Issue Date: 01-Oct-2026 05:30
Passenger Name: Mohammad Rafiqul Islam
NID / Identity Ref: SYN-NID-88392014

TRAIN DETAILS:
Train No: 702
Train Name: Suborno Express
Origin Station: Dhaka [DA]
Destination Station: Chittagong [CTG]
Journey Date: 15-Oct-2026
Scheduled Departure Time: 16:30 BST
Scheduled Arrival Time: 21:50 BST

SEATING & FARE:
Class: Snigdha (AC Chair)
Coach: KHA
Seat No: 15
Adult: 1  Child: 0
Ticket Fare: BDT 1250.00
VAT: BDT 187.50
Total Amount: BDT 1437.50
Payment Gateway: bKash Escrow Gateway
Status: CONFIRMED
============================================================
Notice: This document is an informational extraction.
Official validation required at boarding inspection.
============================================================
    `.trim();

    return {
      rawText: standardTicketText,
      confidence: 96.8,
      blocks: standardTicketText.split('\n').map((line) => ({
        text: line.trim(),
        confidence: 96.8,
      })),
      metadata: {
        engine: this.name,
        version: '1.0.0',
        pageCount: 1,
        skewAngle: 0.2,
        detectedLanguage: 'en',
        ocrOutcome: 'SUCCESS',
      },
    };
  }
}
