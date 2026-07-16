// Authentication business logic and cookie-session handling.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, findUserById } from '../models/userModel.js';

const ONE_HOUR_MS = 60 * 60 * 1000;
const ACCESS_TOKEN_SECONDS = 15 * 60;
const ACCESS_COOKIE = 'vekan_access';
const REFRESH_COOKIE = 'vekan_refresh';

const accessSecret = process.env.JWT_ACCESS_SECRET || 'development-only-access-secret-change-me';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'development-only-refresh-secret-change-me';

if (process.env.NODE_ENV === 'production'
    && (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required in production');
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
};

function publicUser(payload) {
  return {
    id: payload.sub || payload.id,
    full_name: payload.full_name,
    email: payload.email,
    role: payload.role,
  };
}

function setSessionCookies(response, user, sessionExpiresAt) {
  const now = Date.now();
  const remainingMs = Math.max(0, sessionExpiresAt - now);
  const remainingSeconds = Math.max(1, Math.floor(remainingMs / 1000));
  const accessSeconds = Math.min(ACCESS_TOKEN_SECONDS, remainingSeconds);
  const claims = {
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    sessionExpiresAt,
  };
  const accessToken = jwt.sign(claims, accessSecret, {
    subject: user.id,
    expiresIn: accessSeconds,
  });
  const refreshToken = jwt.sign(claims, refreshSecret, {
    subject: user.id,
    expiresIn: remainingSeconds,
  });

  response.cookie(ACCESS_COOKIE, accessToken, { ...cookieOptions, maxAge: remainingMs });
  response.cookie(REFRESH_COOKIE, refreshToken, { ...cookieOptions, maxAge: remainingMs });
}

export async function verifyCredentials(email, password) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail || !password) return null;
  const user = await findUserByEmail(normalizedEmail);
  if (
    !user?.active
    || !user.email_verified
    || !user.password_hash
    || !await bcrypt.compare(password, user.password_hash)
  ) return null;
  return publicUser(user);
}

export function createSession(response, user) {
  const expiresAt = Date.now() + ONE_HOUR_MS;
  setSessionCookies(response, user, expiresAt);
  return { user, expiresAt };
}

export function clearSession(response) {
  response.clearCookie(ACCESS_COOKIE, cookieOptions);
  response.clearCookie(REFRESH_COOKIE, cookieOptions);
}

function readSession(request, response) {
  const accessToken = request.cookies?.[ACCESS_COOKIE];
  if (accessToken) {
    try {
      const payload = jwt.verify(accessToken, accessSecret);
      return { user: publicUser(payload), expiresAt: payload.sessionExpiresAt };
    } catch (error) {
      if (error.name !== 'TokenExpiredError') throw error;
    }
  }

  const refreshToken = request.cookies?.[REFRESH_COOKIE];
  if (!refreshToken) return null;
  const payload = jwt.verify(refreshToken, refreshSecret);
  if (Number(payload.sessionExpiresAt) <= Date.now()) return null;
  const user = publicUser(payload);
  setSessionCookies(response, user, payload.sessionExpiresAt);
  return { user, expiresAt: payload.sessionExpiresAt };
}

export async function requireSession(request, response, next) {
  try {
    const session = readSession(request, response);
    if (!session) {
      clearSession(response);
      return response.status(401).json({ code: 'SESSION_EXPIRED', detail: 'Your session has expired.' });
    }
    const currentUser = await findUserById(session.user.id);
    if (!currentUser?.active || !currentUser.email_verified) {
      clearSession(response);
      return response.status(401).json({
        code: 'SESSION_EXPIRED',
        detail: 'Your session has expired.',
      });
    }
    request.user = publicUser(currentUser);
    request.sessionExpiresAt = session.expiresAt;
    next();
  } catch (_error) {
    clearSession(response);
    response.status(401).json({ code: 'SESSION_EXPIRED', detail: 'Your session has expired.' });
  }
}

export function requireRole(...roles) {
  return (request, response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return response.status(403).json({ detail: 'You do not have permission to perform this action.' });
    }
    next();
  };
}
