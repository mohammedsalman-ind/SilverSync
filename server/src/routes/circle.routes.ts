import { Router } from 'express';
import { circleController } from '../controllers/circle.controller';
import { inviteController } from '../controllers/invite.controller';
import { requireAuth } from '../middleware/auth';
import { requireCircleMember } from '../middleware/requireCircleMember';
import { requireElder } from '../middleware/requirePermission';
import { validate } from '../middleware/validate';
import {
  createCircleSchema,
  circleIdParamSchema,
  memberUidParamSchema,
  updateMemberSchema,
} from '../schemas/circle.schema';
import { createInviteSchema } from '../schemas/invite.schema';

const router = Router();

// Create Care Circle (Elder)
router.post('/', requireAuth, validate(createCircleSchema), (req, res, next) =>
  circleController.createCircle(req, res, next)
);

// Get Circle Details
router.get(
  '/:id',
  requireAuth,
  validate(circleIdParamSchema),
  requireCircleMember,
  (req, res, next) => circleController.getCircle(req, res, next)
);

// List Circle Members
router.get(
  '/:id/members',
  requireAuth,
  validate(circleIdParamSchema),
  requireCircleMember,
  (req, res, next) => circleController.listMembers(req, res, next)
);

// Update Member (Elder only: approve, change role/permissions)
router.patch(
  '/:id/members/:uid',
  requireAuth,
  validate(updateMemberSchema),
  requireCircleMember,
  requireElder,
  (req, res, next) => circleController.updateMember(req, res, next)
);

// Revoke Member (Elder only)
router.delete(
  '/:id/members/:uid',
  requireAuth,
  validate(memberUidParamSchema),
  requireCircleMember,
  requireElder,
  (req, res, next) => circleController.revokeMember(req, res, next)
);

// Generate Invite Code (Elder only)
router.post(
  '/:id/invites',
  requireAuth,
  validate(createInviteSchema),
  requireCircleMember,
  requireElder,
  (req, res, next) => inviteController.createInvite(req, res, next)
);

export default router;
