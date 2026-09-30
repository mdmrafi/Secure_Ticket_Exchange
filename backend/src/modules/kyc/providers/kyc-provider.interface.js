/**
 * Abstract KYC Provider Interface
 * All concrete identity verification providers (Mock, Persona, SumSub, Onfido, etc.)
 * must implement this contract.
 */
export class KYCProvider {
  /**
   * Return the identifier name of this provider (e.g. 'mock', 'persona', 'sumsub')
   * @returns {string}
   */
  getName() {
    throw new Error('getName() must be implemented by subclass');
  }

  /**
   * Initiate a verification session
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.userEmail
   * @param {object} [params.metadata]
   * @returns {Promise<{
   *   providerReferenceId: string,
   *   sessionUrl?: string,
   *   clientToken?: string,
   *   expiresAt?: Date,
   *   status: string
   * }>}
   */
  async initiateVerification(params) {
    throw new Error('initiateVerification() must be implemented by subclass');
  }

  /**
   * Submit identity verification data
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.providerReferenceId
   * @param {string} params.documentType
   * @param {object} params.syntheticIdentityData - Synthetic identity data
   * @returns {Promise<{
   *   status: string,
   *   providerReferenceId: string,
   *   rejectionReason?: string,
   *   reviewNotes?: string,
   *   providerMetadata: object,
   *   verificationLevel: string,
   *   expiresAt: Date
   * }>}
   */
  async submitVerification(params) {
    throw new Error('submitVerification() must be implemented by subclass');
  }

  /**
   * Check the current verification status from the external provider
   * @param {object} params
   * @param {string} params.providerReferenceId
   * @param {object} params.kycRecord
   * @returns {Promise<{
   *   status: string,
   *   providerMetadata: object,
   *   rejectionReason?: string
   * }>}
   */
  async checkStatus(params) {
    throw new Error('checkStatus() must be implemented by subclass');
  }

  /**
   * Process asynchronous webhook callback from external KYC provider
   * @param {object} payload
   * @param {string} signature
   * @returns {Promise<{
   *   userId: string,
   *   status: string,
   *   providerReferenceId: string,
   *   rejectionReason?: string,
   *   providerMetadata?: object
   * }>}
   */
  async handleWebhook(payload, signature) {
    throw new Error('handleWebhook() must be implemented by subclass');
  }
}
