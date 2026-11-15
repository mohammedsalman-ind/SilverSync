import { Request, Response, NextFunction } from 'express';
import { inviteService } from '../services/invite.service';

export class InviteController {
  async createInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const circleId = req.params.id;
      const elderUid = req.user!.uid;
      const invite = await inviteService.createInvite(circleId, elderUid);
      res.status(201).json({
        success: true,
        data: invite,
      });
    } catch (error) {
      next(error);
    }
  }

  async redeemInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.body;
      const inviteeUid = req.user!.uid;
      const result = await inviteService.redeemInvite(code, inviteeUid);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const inviteController = new InviteController();
