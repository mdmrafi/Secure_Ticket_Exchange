import { Inngest } from 'inngest';
import { env } from './env.config.js';

export const inngest = new Inngest({
  id: env.INNGEST_APP_ID,
  eventKey: env.INNGEST_EVENT_KEY,
  env: env.NODE_ENV,
});
