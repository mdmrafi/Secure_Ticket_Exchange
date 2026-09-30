import { KYCRecord } from './kyc.model.js';
import { KYCAuditLog } from './kyc-audit.model.js';

export class KYCRepository {
  /**
   * Find KYC record for a given user ID
   * Note: encryptedIdentityData and documentHash are excluded by default
   * @param {string} userId
   * @returns {Promise<KYCRecord|null>}
   */
  async findByUserId(userId) {
    return KYCRecord.findOne({ userId });
  }

  /**
   * Find KYC record including internal encrypted identity data
   * (Strictly for secure internal verification routines, never exposed to clients)
   * @param {string} userId
   * @returns {Promise<KYCRecord|null>}
   */
  async findByUserIdWithSecrets(userId) {
    return KYCRecord.findOne({ userId }).select('+encryptedIdentityData +documentHash');
  }

  /**
   * Find KYC record by external provider reference ID
   * @param {string} providerReferenceId
   * @returns {Promise<KYCRecord|null>}
   */
  async findByProviderReferenceId(providerReferenceId) {
    return KYCRecord.findOne({ providerReferenceId });
  }

  /**
   * Check if a document hash already exists in another verified user's record
   * @param {string} documentHash
   * @param {string} excludeUserId
   * @returns {Promise<boolean>}
   */
  async isDocumentDuplicate(documentHash, excludeUserId) {
    if (!documentHash) return false;
    const existing = await KYCRecord.findOne({
      documentHash,
      userId: { $ne: excludeUserId },
      status: { $in: ['VERIFIED', 'PENDING', 'MANUAL_REVIEW'] },
    }).select('_id');
    return Boolean(existing);
  }

  /**
   * Create a new KYC record
   * @param {object} data
   * @returns {Promise<KYCRecord>}
   */
  async create(data) {
    return KYCRecord.create(data);
  }

  /**
   * Update KYC record by user ID
   * @param {string} userId
   * @param {object} updateData
   * @returns {Promise<KYCRecord|null>}
   */
  async updateByUserId(userId, updateData) {
    return KYCRecord.findOneAndUpdate({ userId }, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Upsert KYC record for a user
   * @param {string} userId
   * @param {object} updateData
   * @returns {Promise<KYCRecord>}
   */
  async upsertByUserId(userId, updateData) {
    return KYCRecord.findOneAndUpdate(
      { userId },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  /**
   * Record an immutable audit log entry for a KYC status change
   * @param {object} auditData
   * @returns {Promise<KYCAuditLog>}
   */
  async createAuditLog(auditData) {
    return KYCAuditLog.create(auditData);
  }

  /**
   * Get audit history for a user's KYC lifecycle
   * @param {string} userId
   * @param {number} [limit=50]
   * @returns {Promise<KYCAuditLog[]>}
   */
  async getAuditLogs(userId, limit = 50) {
    return KYCAuditLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit);
  }
}

export const kycRepository = new KYCRepository();
