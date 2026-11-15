import { Router } from 'express';
import { medicineController } from '../controllers/medicine.controller';
import { requireAuth } from '../middleware/auth';
import { requireCircleMember } from '../middleware/requireCircleMember';
import { requirePermission } from '../middleware/requirePermission';
import { validate } from '../middleware/validate';
import {
  createMedicineSchema,
  updateMedicineSchema,
  refillMedicineSchema,
} from '../schemas/medicine.schema';
import { circleIdParamSchema } from '../schemas/circle.schema';

const router = Router();

// List active medicines for a circle
router.get(
  '/circles/:id/medicines',
  requireAuth,
  validate(circleIdParamSchema),
  requireCircleMember,
  (req, res, next) => medicineController.list(req, res, next)
);

// Create medicine (Elder direct, family/caregiver via proposal)
router.post(
  '/circles/:id/medicines',
  requireAuth,
  validate(createMedicineSchema),
  requireCircleMember,
  requirePermission('manage_medicines'),
  (req, res, next) => medicineController.create(req, res, next)
);

// Update medicine
router.patch(
  '/medicines/:id',
  requireAuth,
  validate(updateMedicineSchema),
  (req, res, next) => medicineController.update(req, res, next)
);

// Delete medicine
router.delete('/medicines/:id', requireAuth, (req, res, next) =>
  medicineController.delete(req, res, next)
);

// Refill medicine stock (Allowed directly with manage_medicines)
router.post(
  '/medicines/:id/refill',
  requireAuth,
  validate(refillMedicineSchema),
  (req, res, next) => medicineController.refill(req, res, next)
);

export default router;
