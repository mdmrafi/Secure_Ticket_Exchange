/**
 * Base abstract class defining the contract for Authentication Providers.
 * This enables zero-friction switching or hybrid operation between
 * native JWT and external identity providers like Clerk, Auth0, or Supabase.
 */
export class AuthProviderInterface {
  /**
   * Verify an authentication token and return decoded payload
   * @param {string} token
   * @returns {Promise<{ userId: string, email: string, roles: string[] }>}
   */
  async verifyToken(token) {
    throw new Error('Method verifyToken() must be implemented.');
  }

  /**
   * Generate tokens for user session (for providers managing their own tokens)
   * @param {object} payload
   * @returns {Promise<{ accessToken: string, refreshToken?: string }>}
   */
  async generateTokens(payload) {
    throw new Error('Method generateTokens() must be implemented.');
  }

  /**
   * Revoke or invalidate token session
   * @param {string} token
   */
  async revokeSession(token) {
    throw new Error('Method revokeSession() must be implemented.');
  }
}
