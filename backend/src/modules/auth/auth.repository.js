/**
 * Auth Repository
 * Data access abstraction for session management, tokens, and credentials.
 */
export class AuthRepository {
  async saveRefreshToken(userId, token, expiresAt) {
    // Repository stub ready for persistent refresh token storage / Redis
    return { userId, token, expiresAt };
  }

  async findRefreshToken(token) {
    // Repository stub
    return null;
  }

  async revokeRefreshToken(token) {
    // Repository stub
    return true;
  }
}

export const authRepository = new AuthRepository();
