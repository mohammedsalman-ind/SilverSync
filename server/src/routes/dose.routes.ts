import { Router } from 'express';
import { doseController } from '../controllers/dose.controller';
import { requireAuth } from '../middleware/auth';
import { requireCircleMember } from '../middleware/requireCircleMember';
import { validate } from '../middleware/validate';
import { logDoseSchema, todayDosesQuerySchema } from '../schemas/dose.schema';

const router = Router();

// Get today's doses for circle
router.get(
  '/circles/:id/doses/today',
  requireAuth,
  validate(todayDosesQuerySchema),
  requireCircleMember,
  (req, res, next) => doseController.getToday(req, res, next)
);

// Log dose status (taken or skipped)
router.post('/doses/:id/log', requireAuth, validate(logDoseSchema), (req, res, next) =>
  doseController.logDose(req, res, next)
);

export default router;
