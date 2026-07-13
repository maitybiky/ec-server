import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { authRepository } from './auth.repository.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { env } from '../../shared/config/env.js';
import { loggerFor } from '../../shared/logger/logger.js';

const log = loggerFor('auth');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY },
  );
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user.id }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  });
}

const sha256 = (value) =>
  crypto.createHash('sha256').update(value).digest('hex');

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await authRepository.setRefreshTokenHash(user.id, sha256(refreshToken));
  return { accessToken, refreshToken };
}

export const authService = {
  async register({ name, email, password }) {
    const existing = await authRepository.findByEmail(email);
    if (existing) throw ApiError.conflict('Email is already registered');

    const user = await authRepository.create({ name, email, password });
    const tokens = await issueTokens(user);
    return { user: publicUser(user), ...tokens };
  },

  async login({ email, password }) {
    const user = await authRepository.findByEmail(email, {
      withPassword: true,
    });
    if (!user || !(await user.comparePassword(password))) {
      log.warn({ email }, 'failed login attempt');
      throw ApiError.unauthorized('Invalid email or password');
    }

    const tokens = await issueTokens(user);
    return { user: publicUser(user), ...tokens };
  },

  async refresh(refreshToken) {
    if (!refreshToken) throw ApiError.unauthorized('Refresh token missing');

    let payload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await authRepository.findById(payload.sub, {
      withRefreshTokenHash: true,
    });
    if (!user || user.refreshTokenHash !== sha256(refreshToken)) {
      throw ApiError.unauthorized('Refresh token has been revoked');
    }

    const tokens = await issueTokens(user);
    return { user: publicUser(user), ...tokens };
  },

  async logout(userId) {
    await authRepository.setRefreshTokenHash(userId, null);
  },

  async me(userId) {
    const user = await authRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return publicUser(user);
  },
};
