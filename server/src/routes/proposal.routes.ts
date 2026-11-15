import { Router } from 'express';
import { proposalController } from '../controllers/proposal.controller';
import { requireAuth } from '../middleware/auth';
import { requireCircleMember } from '../middleware/requireCircleMember';
import { requireElder } from '../middleware/requirePermission';
import { validate } from '../middleware/validate';
import { circleIdParamSchema } from '../schemas/circle.schema';
import { proposalIdParamSchema } from '../schemas/proposal.schema';

const router = Router();

// List pending proposals (Elder only)
router.get(
  '/circles/:id/proposals',
  requireAuth,
  validate(circleIdParamSchema),
  requireCircleMember,
  requireElder,
  (req, res, next) => proposalController.list(req, res, next)
);

// Approve proposed change (Elder only)
router.post(
  '/proposals/:id/approve',
  requireAuth,
  validate(proposalIdParamSchema),
  (req, res, next) => proposalController.approve(req, res, next)
);

// Reject proposed change (Elder only)
router.post(
  '/proposals/:id/reject',
  requireAuth,
  validate(proposalIdParamSchema),
  (req, res, next) => proposalController.reject(req, res, next)
);

export default router;
