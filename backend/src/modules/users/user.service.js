import { userRepository } from './user.repository.js';
import { NotFoundError } from '../../common/errors/index.js';

export class UserService {
  constructor(repo = userRepository) {
    this.repo = repo;
  }

  async getUserProfile(userId) {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async updateUserProfile(userId, updateData) {
    const user = await this.repo.updateById(userId, updateData);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async listUsers(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { items, total } = await this.repo.list({}, { skip, limit });

    return {
      users: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const userService = new UserService();
