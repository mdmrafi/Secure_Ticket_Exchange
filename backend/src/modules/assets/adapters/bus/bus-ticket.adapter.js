import { AssetAdapter } from '../interfaces/asset-adapter.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';
import { BusTicketMetadata } from './bus-ticket.metadata.js';
import { BusTicketValidator } from './bus-ticket.validator.js';
import { BusTicketVerifier } from './bus-ticket.verifier.js';
import { BusTicketTransferPolicy } from './bus-ticket.transfer-policy.js';
import { BusTicketTransferProvider } from './bus-ticket.transfer-provider.js';

export class BusTicketAdapter extends AssetAdapter {
  constructor() {
    super({
      assetType: AssetTypes.BUS_TICKET,
      displayName: 'Bus Ticket',
      metadata: new BusTicketMetadata(),
      validator: new BusTicketValidator(),
      verifier: new BusTicketVerifier(),
      transferPolicy: new BusTicketTransferPolicy(),
      transferProvider: new BusTicketTransferProvider(),
    });
  }
}
