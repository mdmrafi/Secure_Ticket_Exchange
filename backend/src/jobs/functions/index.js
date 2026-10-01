import { auditJobs } from './audit.jobs.js';
import { notificationJobs } from './notification.jobs.js';
import { emailJobs } from './email.jobs.js';
import { reservationCleanupJobs } from './reservation-cleanup.jobs.js';
import { verificationJobs, verificationRetriesJob } from './verification-retry.jobs.js';
import { reminderJobs, transactionRemindersJob } from './transaction-reminder.jobs.js';

// Aggregate all Inngest functions for API serve loader
export const allInngestFunctions = [
  ...auditJobs,
  ...notificationJobs,
  ...emailJobs,
  ...reservationCleanupJobs,
  ...verificationJobs,
  ...reminderJobs,
];

// Named exports for direct access and testing
export {
  auditJobs,
  notificationJobs,
  emailJobs,
  reservationCleanupJobs,
  verificationJobs,
  reminderJobs,
  verificationRetriesJob,
  transactionRemindersJob,
};
