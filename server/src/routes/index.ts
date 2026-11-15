import { Router } from 'express';
import authRoutes from './auth.routes';
import circleRoutes from './circle.routes';
import inviteRoutes from './invite.routes';
import medicineRoutes from './medicine.routes';
import doseRoutes from './dose.routes';
import adherenceRoutes from './adherence.routes';
import proposalRoutes from './proposal.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/circles', circleRoutes);
router.use('/invites', inviteRoutes);
router.use('/', medicineRoutes);
router.use('/', doseRoutes);
router.use('/', adherenceRoutes);
router.use('/', proposalRoutes);

export default router;
