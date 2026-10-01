import { RiskLevel } from '../../../common/constants/asset-types.constant.js';

export { RiskLevel };

export const FraudSignalCode = {
  REPEATED_LISTING_SAME_ASSET: 'REPEATED_LISTING_SAME_ASSET',
  SUSPICIOUS_ACCOUNT_ACTIVITY: 'SUSPICIOUS_ACCOUNT_ACTIVITY',
  EXCESSIVE_CANCELLATIONS: 'EXCESSIVE_CANCELLATIONS',
  MULTIPLE_FAILED_TRANSACTIONS: 'MULTIPLE_FAILED_TRANSACTIONS',
  DUPLICATE_DOCUMENT_FINGERPRINTS: 'DUPLICATE_DOCUMENT_FINGERPRINTS',
  OCR_INCONSISTENCIES: 'OCR_INCONSISTENCIES',
  TICKET_VERIFICATION_MISMATCH: 'TICKET_VERIFICATION_MISMATCH',
  ABNORMAL_LISTING_FREQUENCY: 'ABNORMAL_LISTING_FREQUENCY',
  REPORTED_ACCOUNT: 'REPORTED_ACCOUNT',
  DOCUMENT_TAMPERING_INDICATORS: 'DOCUMENT_TAMPERING_INDICATORS',
};

export const FraudSignalMetadata = {
  [FraudSignalCode.REPEATED_LISTING_SAME_ASSET]: {
    name: 'Repeated Listing of Same Asset',
    category: 'INVENTORY_FRAUD',
    defaultSeverity: RiskLevel.HIGH,
    weight: 0.15,
    description: 'Detects duplicate listings or re-listing of the same underlying asset identifier across accounts or within short timeframes.',
  },
  [FraudSignalCode.SUSPICIOUS_ACCOUNT_ACTIVITY]: {
    name: 'Suspicious Account Activity',
    category: 'IDENTITY_FRAUD',
    defaultSeverity: RiskLevel.MEDIUM,
    weight: 0.10,
    description: 'Detects anomalies such as newly created unverified accounts attempting high-value or high-velocity listings.',
  },
  [FraudSignalCode.EXCESSIVE_CANCELLATIONS]: {
    name: 'Excessive Cancellations',
    category: 'BEHAVIORAL_FRAUD',
    defaultSeverity: RiskLevel.HIGH,
    weight: 0.10,
    description: 'Flags accounts exhibiting an unusually high ratio of cancelled listings or transactions.',
  },
  [FraudSignalCode.MULTIPLE_FAILED_TRANSACTIONS]: {
    name: 'Multiple Failed Transactions',
    category: 'PAYMENT_FRAUD',
    defaultSeverity: RiskLevel.HIGH,
    weight: 0.10,
    description: 'Identifies accounts or assets associated with recurring payment failures or fraudulent checkout behavior.',
  },
  [FraudSignalCode.DUPLICATE_DOCUMENT_FINGERPRINTS]: {
    name: 'Duplicate Document Fingerprints',
    category: 'COLLUSION_FRAUD',
    defaultSeverity: RiskLevel.CRITICAL,
    weight: 0.15,
    description: 'Flags ticket uploads whose file hash or cryptographic fingerprint matches an existing asset uploaded by another user.',
  },
  [FraudSignalCode.OCR_INCONSISTENCIES]: {
    name: 'OCR Inconsistencies',
    category: 'TAMPERING_FRAUD',
    defaultSeverity: RiskLevel.MEDIUM,
    weight: 0.10,
    description: 'Identifies conflicts between machine-extracted OCR text and seller-submitted ticket metadata.',
  },
  [FraudSignalCode.TICKET_VERIFICATION_MISMATCH]: {
    name: 'Ticket Verification Mismatch',
    category: 'AUTHORITY_MISMATCH',
    defaultSeverity: RiskLevel.CRITICAL,
    weight: 0.15,
    description: 'Detects discrepancies between ticket details and official transport authority provider records.',
  },
  [FraudSignalCode.ABNORMAL_LISTING_FREQUENCY]: {
    name: 'Abnormal Listing Frequency',
    category: 'SCALPING_BOTS',
    defaultSeverity: RiskLevel.MEDIUM,
    weight: 0.05,
    description: 'Identifies burst listing activity indicative of automated bot scraping or ticket hoarding.',
  },
  [FraudSignalCode.REPORTED_ACCOUNT]: {
    name: 'Reported Account',
    category: 'REPUTATION_RISK',
    defaultSeverity: RiskLevel.HIGH,
    weight: 0.10,
    description: 'Identifies accounts with active buyer reports or pending dispute investigations for fraudulent conduct.',
  },
  [FraudSignalCode.DOCUMENT_TAMPERING_INDICATORS]: {
    name: 'Document Tampering Indicators',
    category: 'FORGERY_FRAUD',
    defaultSeverity: RiskLevel.CRITICAL,
    weight: 0.15,
    description: 'Detects file metadata modifications, digital editing artifacts, font inconsistencies, or invalid magic bytes.',
  },
};

export const AssessmentStatus = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  REVIEWED: 'REVIEWED',
  RESOLVED: 'RESOLVED',
  AUTO_APPROVED: 'AUTO_APPROVED',
};

export const ReviewDecisionType = {
  APPROVE: 'APPROVE',
  FLAG_FOR_MONITORING: 'FLAG_FOR_MONITORING',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
  REJECT_ASSET: 'REJECT_ASSET',
  SUSPEND_USER: 'SUSPEND_USER',
};
