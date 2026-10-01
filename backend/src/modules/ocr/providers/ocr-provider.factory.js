import { MockOCRProvider } from './mock-ocr.provider.js';
import { logger } from '../../../config/logger.config.js';

const mockOCR = new MockOCRProvider();
const ocrRegistry = new Map();
ocrRegistry.set('mock', mockOCR);
ocrRegistry.set('local', mockOCR);

/**
 * Register a custom OCR provider (e.g. GoogleVisionOCR, TextractOCR, TesseractOCR)
 * @param {string} name
 * @param {import('./ocr-provider.interface.js').OCRProvider} provider
 */
export const registerOCRProvider = (name, provider) => {
  ocrRegistry.set(name.toLowerCase(), provider);
  logger.info({ providerName: name }, '[OCRProviderFactory] Registered custom OCR provider');
};

/**
 * Factory function to retrieve the configured OCR Provider
 * @param {string} [name]
 * @returns {import('./ocr-provider.interface.js').OCRProvider}
 */
export const getOCRProvider = (name = 'mock') => {
  const provider = ocrRegistry.get(name.toLowerCase());
  if (!provider) {
    logger.warn(
      { requested: name, fallback: 'mock' },
      '[OCRProviderFactory] Provider not found, falling back to mock'
    );
    return mockOCR;
  }
  return provider;
};
