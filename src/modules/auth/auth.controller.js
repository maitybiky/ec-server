import { authService } from './auth.service.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { env } from '../../shared/config/env.js';

const REFRESH_COOKIE = 'refreshToken';

// In production the frontend and API live on different sites (e.g. *.onrender.com
// subdomains are separate sites), so the cookie must be SameSite=None + Secure or
// browsers silently drop it and /auth/refresh can never see it.
const cookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/api/auth',
});

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    ...cookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.register(
      req.body,
    );
    setRefreshCookie(res, refreshToken);
    ApiResponse.created(res, 'Registered successfully', { user, accessToken });
  }),

  login: asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.login(
      req.body,
    );
    setRefreshCookie(res, refreshToken);
    ApiResponse.ok(res, 'Logged in successfully', { user, accessToken });
  }),

  refresh: asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.refresh(
      req.cookies[REFRESH_COOKIE],
    );
    setRefreshCookie(res, refreshToken);
    ApiResponse.ok(res, 'Token refreshed', { user, accessToken });
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.user.id);
    res.clearCookie(REFRESH_COOKIE, cookieOptions());
    ApiResponse.ok(res, 'Logged out');
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authService.me(req.user.id);
    ApiResponse.ok(res, 'Current user', { user });
  }),
};
