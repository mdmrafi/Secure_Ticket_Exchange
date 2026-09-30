/**
 * Abstract Railway Verification Provider Interface
 *
 * Defines the contract for authoritative railway ticketing verification gateways.
 * Design ensures clean separation between mock simulation and future official
 * Bangladesh Railway permitted enterprise APIs without bypassing anti-bot protections.
 */
export class RailwayVerificationProvider {
  /**
   * Return the identifier name of this provider
   * @returns {string}
   */
  getName() {
    throw new Error('getName() must be implemented by subclass');
  }

  /**
   * Query authoritative railway registry for ticket validity
   *
   * @param {object} params
   * @param {string} params.pnr - Passenger Name Record identifier
   * @param {string} [params.ticketNumber] - Electronic ticket reference
   * @param {string} [params.passengerName] - Name on ticket
   * @param {string} [params.trainNumber] - Train code
   * @param {string} [params.journeyDate] - Date of travel
   * @param {string} [params.fromStation] - Origin station
   * @param {string} [params.toStation] - Destination station
   * @param {object} [params.options] - Optional flags or configuration
   * @returns {Promise<{
   *   status: 'VERIFIED' | 'FAILED' | 'SUSPICIOUS' | 'MANUAL_REVIEW',
   *   ticketExists: boolean,
   *   passengerMatch: boolean,
   *   journeyMatch: boolean,
   *   verificationTimestamp: Date,
   *   source: string,
   *   details?: object,
   *   errorMessage?: string
   * }>}
   */
  async verifyTicket(params) {
    throw new Error('verifyTicket() must be implemented by concrete provider');
  }
}
