import bcrypt from 'bcryptjs';
import { authRepository } from './auth.repository.js';
import { userRepository } from '../users/user.repository.js';
import { getAuthProvider } from './auth.provider.factory.js';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  NotFoundError,
} from '../../common/errors/index.js';
import { publishEvent } from '../../jobs/publisher.js';
import { EventNames } from '../../common/constants/events.constant.js';

export class AuthService {
  constructor(authRepo = authRepository, userRepo = userRepository) {
    this.authRepo = authRepo;
    this.userRepo = userRepo;
  }

  /**
   * Helper to format a user document safely without sensitive data
   */
  formatUserResponse(user) {
    return {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      accountStatus: user.accountStatus,
      emailVerified: user.emailVerified,
      trustScore: user.trustScore,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Register a new user
   */
  async register(registrationData, clientInfo = {}) {
    const existing = await this.userRepo.findByEmail(registrationData.email);
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    // Secure password hashing with salt factor 12
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(registrationData.password, salt);

    const user = await this.userRepo.create({
      name: registrationData.name,
      email: registrationData.email,
      phone: registrationData.phone || '',
      passwordHash,
      role: 'USER', // Strictly forced to USER to prevent privilege escalation
      accountStatus: 'ACTIVE',
      emailVerified: false,
    });

    const provider = getAuthProvider();
    const tokens = await provider.generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Persist refresh token in database
    await this.authRepo.saveRefreshToken({
      token: tokens.refreshToken,
      userId: user._id,
      expiresAt: tokens.refreshExpiresAt,
      createdByIp: clientInfo.ip || null,
      userAgent: clientInfo.userAgent || null,
    });

    // Asynchronously dispatch user.created event for background jobs (welcome email, audit processing)
    publishEvent(
      EventNames.USER_CREATED,
      {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      { id: user._id.toString(), email: user.email, role: user.role }
    ).catch(() => {});

    return {
      user: this.formatUserResponse(user),
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    };
  }

  /**
   * Login user with credentials
   */
  async login(credentials, clientInfo = {}) {
    const user = await this.userRepo.findByEmail(credentials.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check account status
    if (user.accountStatus === 'SUSPENDED') {
      throw new ForbiddenError('Your account has been suspended. Please contact support.');
    }
    if (user.accountStatus === 'DEACTIVATED') {
      throw new ForbiddenError('Your account has been deactivated.');
    }

    // Compare bcrypt password hash
    const isPasswordValid = await user.comparePassword(credentials.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const provider = getAuthProvider();
    const tokens = await provider.generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Persist refresh token
    await this.authRepo.saveRefreshToken({
      token: tokens.refreshToken,
      userId: user._id,
      expiresAt: tokens.refreshExpiresAt,
      createdByIp: clientInfo.ip || null,
      userAgent: clientInfo.userAgent || null,
    });

    return {
      user: this.formatUserResponse(user),
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    };
  }

  /**
   * Refresh session using refresh token with rotation and reuse detection
   */
  async refreshSession(refreshTokenString, clientInfo = {}) {
    if (!refreshTokenString) {
      throw new UnauthorizedError('Refresh token is required');
    }

    const storedToken = await this.authRepo.findRefreshToken(refreshTokenString);
    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Reuse detection: if a revoked token is presented, compromise is suspected
    if (storedToken.isRevoked) {
      await this.authRepo.revokeAllUserTokens(storedToken.userId?._id || storedToken.userId);
      throw new UnauthorizedError(
        'Revoked token reuse detected. All sessions invalidated for security.'
      );
    }

    // Check expiration
    if (new Date() > new Date(storedToken.expiresAt)) {
      throw new UnauthorizedError('Refresh token has expired. Please sign in again.');
    }

    const user = storedToken.userId;
    if (!user || user.accountStatus !== 'ACTIVE') {
      throw new UnauthorizedError('User account is invalid or inactive');
    }

    const provider = getAuthProvider();
    const newTokens = await provider.generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Invalidate old refresh token and link replacement
    await this.authRepo.revokeRefreshToken(refreshTokenString, newTokens.refreshToken);

    // Save rotated new refresh token
    await this.authRepo.saveRefreshToken({
      token: newTokens.refreshToken,
      userId: user._id,
      expiresAt: newTokens.refreshExpiresAt,
      createdByIp: clientInfo.ip || null,
      userAgent: clientInfo.userAgent || null,
    });

    return {
      tokens: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresIn: newTokens.expiresIn,
      },
    };
  }

  /**
   * Logout user by invalidating the refresh token
   */
  async logout(refreshTokenString) {
    if (refreshTokenString) {
      await this.authRepo.revokeRefreshToken(refreshTokenString);
    }
    return { message: 'Logged out successfully' };
  }

  /**
   * Get current authenticated user details
   */
  async getCurrentUser(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.formatUserResponse(user);
  }
}

export const authService = new AuthService();
