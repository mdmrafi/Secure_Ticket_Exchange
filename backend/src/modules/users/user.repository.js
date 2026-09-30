import { User } from './user.model.js';

export class UserRepository {
  async findById(id) {
    return User.findById(id);
  }

  async findByEmail(email) {
    return User.findOne({ email }).select('+password');
  }

  async findByExternalAuthId(externalAuthId) {
    return User.findOne({ externalAuthId });
  }

  async create(userData) {
    return User.create(userData);
  }

  async updateById(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async list(filter = {}, pagination = { skip: 0, limit: 20 }) {
    const [items, total] = await Promise.all([
      User.find(filter)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    return { items, total };
  }
}

export const userRepository = new UserRepository();
