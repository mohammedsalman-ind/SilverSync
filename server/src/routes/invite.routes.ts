import { Router } from 'express';
import { inviteController } from '../controllers/invite.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { inviteLimiter } from '../middleware/rateLimiter';
import { redeemInviteSchema } from '../schemas/invite.schema';

const router = Router();

// Redeem Invite Code (Rate-limited, max 5 attempts per 15 min)
router.post('/redeem', inviteLimiter, requireAuth, validate(redeemInviteSchema), (req, res, next) =>
  inviteController.redeemInvite(req, res, next)
);

export default router;
