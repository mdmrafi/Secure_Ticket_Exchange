import { BaseAsset } from './base-asset.js';
import { RailwayTicket } from './railway-ticket.asset.js';
import { BusTicket } from './bus-ticket.asset.js';
import { EventTicket } from './event-ticket.asset.js';
import { DocumentAsset } from './document.asset.js';
import { AssetTypes } from '../../../common/constants/asset-types.constant.js';

export { BaseAsset, RailwayTicket, BusTicket, EventTicket, DocumentAsset };

/**
 * Domain Model Factory: Instantiates the appropriate typed asset class
 * based on assetType.
 *
 * Asset
 *  ├── RailwayTicket
 *  ├── BusTicket
 *  ├── EventTicket
 *  └── Document
 *
 * @param {object} data
 * @returns {BaseAsset}
 */
export const createAssetDomain = (data = {}) => {
  switch (data.assetType) {
    case AssetTypes.RAILWAY_TICKET:
      return new RailwayTicket(data);
    case AssetTypes.BUS_TICKET:
      return new BusTicket(data);
    case AssetTypes.EVENT_TICKET:
      return new EventTicket(data);
    case AssetTypes.DOCUMENT:
      return new DocumentAsset(data);
    case AssetTypes.OTHER:
    default:
      return new BaseAsset(data);
  }
};
