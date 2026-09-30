import { getAuthProvider } from './auth.provider.factory.js';
import { authRepository } from './auth.repository.js';
import { userRepository } from '../users/user.repository.js';

export class AuthService {
  constructor(authRepo = authRepository, userRepo = userRepository) {
    this.authRepo = authRepo;
    this.userRepo = userRepo;
  }

  async register(data) {
    // Architecture stub: Registration orchestration
    return {
      message: 'Registration endpoint ready. Business logic to be implemented.',
      user: { email: data.email, name: data.name },
    };
  }

  async login(credentials) {
    // Architecture stub: Login orchestration with active provider
    const provider = getAuthProvider();
    return {
      message: 'Login endpoint ready. Business logic to be implemented.',
      provider: provider.constructor.name,
      email: credentials.email,
    };
  }

  async logout(userId) {
    return { message: 'Logged out successfully' };
  }

  async getSession(user) {
    return { user };
  }
}

export const authService = new AuthService();
