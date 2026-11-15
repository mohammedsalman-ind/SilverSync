import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { logger } from '../utils/logger';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token missing or invalid. Format: Bearer <token>',
      },
    });
    return;
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // Test mode mock token support
  if (process.env.NODE_ENV === 'test' && token.startsWith('mock-token-')) {
    const uid = token.replace('mock-token-', '');
    req.user = {
      uid,
      email: `${uid}@example.com`,
    };
    next();
    return;
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
    };
    next();
  } catch (error) {
    logger.warn('Failed Firebase ID token verification', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired authentication token.',
      },
    });
  }
}
