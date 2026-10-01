import { AssetAdapter } from '../interfaces/asset-adapter.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';
import { EventTicketMetadata } from './event-ticket.metadata.js';
import { EventTicketValidator } from './event-ticket.validator.js';
import { EventTicketVerifier } from './event-ticket.verifier.js';
import { EventTicketTransferPolicy } from './event-ticket.transfer-policy.js';
import { EventTicketTransferProvider } from './event-ticket.transfer-provider.js';

export class EventTicketAdapter extends AssetAdapter {
  constructor() {
    super({
      assetType: AssetTypes.EVENT_TICKET,
      displayName: 'Event Ticket',
      metadata: new EventTicketMetadata(),
      validator: new EventTicketValidator(),
      verifier: new EventTicketVerifier(),
      transferPolicy: new EventTicketTransferPolicy(),
      transferProvider: new EventTicketTransferProvider(),
    });
  }
}
