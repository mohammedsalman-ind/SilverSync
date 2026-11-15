import { Router } from 'express';
import authRoutes from './auth.routes';
import circleRoutes from './circle.routes';
import inviteRoutes from './invite.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/circles', circleRoutes);
router.use('/invites', inviteRoutes);

export default router;
