import { logger } from '../../../config/logger.config.js';

class AssetAdapterRegistry {
  constructor() {
    this.adapters = new Map();
  }

  /**
   * Register an asset adapter plugin
   * @param {import('./interfaces/asset-adapter.interface.js').AssetAdapter} adapter
   */
  register(adapter) {
    if (!adapter || !adapter.assetType) {
      throw new Error('Cannot register adapter without valid assetType');
    }
    this.adapters.set(adapter.assetType, adapter);
    logger.info(
      { assetType: adapter.assetType, displayName: adapter.displayName },
      '[AssetAdapterRegistry] Registered asset adapter plugin'
    );
    return this;
  }

  /**
   * Retrieve the adapter for a given asset type
   * @param {string} assetType
   * @returns {import('./interfaces/asset-adapter.interface.js').AssetAdapter}
   */
  get(assetType) {
    const adapter = this.adapters.get(assetType);
    if (!adapter) {
      throw new Error(
        `Unsupported asset type: '${assetType}'. Available asset types: [${this.getSupportedTypes().join(', ')}]`
      );
    }
    return adapter;
  }

  /**
   * Check if an adapter is registered for the asset type
   * @param {string} assetType
   * @returns {boolean}
   */
  has(assetType) {
    return this.adapters.has(assetType);
  }

  /**
   * Return array of all registered asset type keys
   * @returns {string[]}
   */
  getSupportedTypes() {
    return Array.from(this.adapters.keys());
  }

  /**
   * Return array of all registered adapters
   */
  getAll() {
    return Array.from(this.adapters.values());
  }

  /**
   * Clear registry (useful for test isolation)
   */
  clear() {
    this.adapters.clear();
  }
}

export const assetAdapterRegistry = new AssetAdapterRegistry();
export const registerAssetAdapter = (adapter) => assetAdapterRegistry.register(adapter);
export const getAssetAdapter = (assetType) => assetAdapterRegistry.get(assetType);
export const hasAssetAdapter = (assetType) => assetAdapterRegistry.has(assetType);
export const getSupportedAssetTypes = () => assetAdapterRegistry.getSupportedTypes();
