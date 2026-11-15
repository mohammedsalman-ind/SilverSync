import { Router } from 'express';
import { adherenceController } from '../controllers/adherence.controller';
import { requireAuth } from '../middleware/auth';
import { requireCircleMember } from '../middleware/requireCircleMember';
import { validate } from '../middleware/validate';
import { circleIdParamSchema } from '../schemas/circle.schema';

const router = Router();

router.get(
  '/circles/:id/adherence',
  requireAuth,
  validate(circleIdParamSchema),
  requireCircleMember,
  (req, res, next) => adherenceController.getMetrics(req, res, next)
);

export default router;
