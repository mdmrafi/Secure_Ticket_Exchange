import { AssetAdapter } from '../interfaces/asset-adapter.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';
import { RailwayTicketMetadata } from './railway-ticket.metadata.js';
import { RailwayTicketValidator } from './railway-ticket.validator.js';
import { RailwayTicketVerifier } from './railway-ticket.verifier.js';
import { RailwayTicketTransferPolicy } from './railway-ticket.transfer-policy.js';
import { RailwayTicketTransferProvider } from './railway-ticket.transfer-provider.js';

export class RailwayTicketAdapter extends AssetAdapter {
  constructor() {
    super({
      assetType: AssetTypes.RAILWAY_TICKET,
      displayName: 'Railway Ticket',
      metadata: new RailwayTicketMetadata(),
      validator: new RailwayTicketValidator(),
      verifier: new RailwayTicketVerifier(),
      transferPolicy: new RailwayTicketTransferPolicy(),
      transferProvider: new RailwayTicketTransferProvider(),
    });
  }
}
