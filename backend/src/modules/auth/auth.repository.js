import { RefreshToken } from './refresh-token.model.js';

export class AuthRepository {
  /**
   * Save a newly issued refresh token
   */
  async saveRefreshToken({ token, userId, expiresAt, createdByIp, userAgent }) {
    return RefreshToken.create({
      token,
      userId,
      expiresAt,
      createdByIp,
      userAgent,
    });
  }

  /**
   * Find a refresh token by string
   */
  async findRefreshToken(token) {
    return RefreshToken.findOne({ token }).populate('userId');
  }

  /**
   * Revoke a single refresh token with optional replacement pointer
   */
  async revokeRefreshToken(token, replacedByToken = null) {
    return RefreshToken.findOneAndUpdate(
      { token },
      {
        isRevoked: true,
        revokedAt: new Date(),
        ...(replacedByToken && { replacedByToken }),
      },
      { new: true }
    );
  }

  /**
   * Revoke all refresh tokens for a user (e.g. security reset or reuse detection)
   */
  async revokeAllUserTokens(userId) {
    return RefreshToken.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
  }
}

export const authRepository = new AuthRepository();
