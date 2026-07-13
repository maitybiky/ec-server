import { User } from '../../models/user.model.js';

export const authRepository = {
  findByEmail(email, { withPassword = false } = {}) {
    const query = User.findOne({ email });
    return withPassword ? query.select('+password') : query;
  },

  findById(id, { withRefreshTokenHash = false } = {}) {
    const query = User.findById(id);
    return withRefreshTokenHash ? query.select('+refreshTokenHash') : query;
  },

  create(data) {
    return User.create(data);
  },

  setRefreshTokenHash(userId, refreshTokenHash) {
    return User.findByIdAndUpdate(userId, { refreshTokenHash });
  },
};
