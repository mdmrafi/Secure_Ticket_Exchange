/**
 * Abstract OCR Provider Interface
 *
 * Defines the contract for document optical character recognition.
 * OCR providers extract raw visual text from document images/PDFs.
 * Note: OCR extraction does NOT prove ticket authenticity; it only extracts text data.
 */
export class OCRProvider {
  /**
   * Return the identifier name of this OCR provider
   * @returns {string}
   */
  getName() {
    throw new Error('getName() must be implemented by subclass');
  }

  /**
   * Extract raw text and layout blocks from a document file
   *
   * @param {string|Buffer} fileInput - Absolute file path or Buffer
   * @param {object} [options]
   * @param {string} [options.mimeType]
   * @param {string} [options.originalFilename]
   * @returns {Promise<{
   *   rawText: string,
   *   confidence: number, // 0 to 100
   *   blocks?: Array<{ text: string, confidence: number }>,
   *   metadata?: object
   * }>}
   */
  async extractText(fileInput, options = {}) {
    throw new Error('extractText() must be implemented by concrete subclass');
  }
}
