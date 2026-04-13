import { Router, Request, Response, NextFunction } from 'express';
import passport from '../config/passport';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { authenticateJwt } from '../middleware/auth';
import { config } from '../utils/config';
import prisma from '../utils/prisma';

const router = Router();

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: config.NODE_ENV === 'production',
  path: '/api/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// GET /api/auth/google — redirect to Google OAuth consent screen
router.get('/google', (req: Request, res: Response, next: NextFunction) => {
  const authOptions: Record<string, unknown> = {
    session: false,
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/youtube.readonly'],
    accessType: 'offline',
    prompt: 'consent',
  };

  passport.authenticate('google', authOptions)(req, res, next);
});

// GET /api/auth/google/callback — handle OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req: Request, res: Response) => {
    const user = req.user as any;
    if (!user || !user.id) {
      res.redirect(`${config.CLIENT_ORIGIN}/login?error=auth_failed`);
      return;
    }

    if (!user.accessToken || !user.refreshToken) {
      res.redirect(`${config.CLIENT_ORIGIN}/login?error=youtube_credentials_missing`);
      return;
    }

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    // Set refresh token as httpOnly cookie
    res.cookie('ft_refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

    // Set short-lived access token cookie for initial handoff
    res.cookie('ft_access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 1000, // 60 seconds
    });

    res.redirect(config.CLIENT_ORIGIN);
  }
);

// GET /api/auth/me — get current user
router.get('/me', authenticateJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout — clear session
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('ft_refresh_token', { path: '/api/auth' });
  res.clearCookie('ft_access_token', { path: '/' });
  res.json({ message: 'Logged out' });
});

// POST /api/auth/refresh — rotate refresh token and issue new access token
router.post('/refresh', async (req: Request, res: Response) => {
  const token = req.cookies?.ft_refresh_token;

  if (!token) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  try {
    const payload = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const newAccessToken = signAccessToken(user.id);
    const newRefreshToken = signRefreshToken(user.id);

    res.cookie('ft_refresh_token', newRefreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({ accessToken: newAccessToken });
  } catch {
    res.clearCookie('ft_refresh_token', { path: '/api/auth' });
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
