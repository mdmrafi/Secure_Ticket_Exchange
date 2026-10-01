import {
  assetAdapterRegistry,
  registerAssetAdapter,
  getAssetAdapter,
  hasAssetAdapter,
  getSupportedAssetTypes,
} from './asset-adapter.registry.js';
import { AssetAdapter } from './interfaces/asset-adapter.interface.js';
import { AssetMetadata } from './interfaces/asset-metadata.interface.js';
import { AssetValidator } from './interfaces/asset-validator.interface.js';
import { AssetVerifier } from './interfaces/asset-verifier.interface.js';
import { TransferPolicy } from './interfaces/transfer-policy.interface.js';
import { TransferProvider } from './interfaces/transfer-provider.interface.js';

import { RailwayTicketAdapter } from './railway/railway-ticket.adapter.js';
import { BusTicketAdapter } from './bus/bus-ticket.adapter.js';
import { EventTicketAdapter } from './event/event-ticket.adapter.js';
import { DocumentAdapter } from './document/document.adapter.js';

// Auto-register the 4 initial foundational asset adapters
registerAssetAdapter(new RailwayTicketAdapter());
registerAssetAdapter(new BusTicketAdapter());
registerAssetAdapter(new EventTicketAdapter());
registerAssetAdapter(new DocumentAdapter());

export {
  // Registry & Helpers
  assetAdapterRegistry,
  registerAssetAdapter,
  getAssetAdapter,
  hasAssetAdapter,
  getSupportedAssetTypes,

  // Interfaces
  AssetAdapter,
  AssetMetadata,
  AssetValidator,
  AssetVerifier,
  TransferPolicy,
  TransferProvider,

  // Concrete Adapters
  RailwayTicketAdapter,
  BusTicketAdapter,
  EventTicketAdapter,
  DocumentAdapter,
};
