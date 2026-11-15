import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import { authSessionSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/session', authLimiter, requireAuth, validate(authSessionSchema), (req, res, next) =>
  authController.session(req, res, next)
);

router.get('/me', requireAuth, (req, res, next) =>
  authController.profile(req, res, next)
);

export default router;
