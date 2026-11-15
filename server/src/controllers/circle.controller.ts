import { Request, Response, NextFunction } from 'express';
import { circleService } from '../services/circle.service';

export class CircleController {
  async createCircle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const elderUid = req.user!.uid;
      const { name } = req.body;
      const circle = await circleService.createCircle(elderUid, name);
      res.status(201).json({
        success: true,
        data: circle,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCircle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const circleId = req.params.id;
      const uid = req.user!.uid;
      const result = await circleService.getCircleDetails(circleId, uid);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const circleId = req.params.id;
      const members = await circleService.listMembers(circleId);
      res.status(200).json({
        success: true,
        data: members,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const circleId = req.params.id;
      const targetUid = req.params.uid;
      const elderUid = req.user!.uid;
      const updated = await circleService.updateMember(circleId, elderUid, targetUid, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const circleId = req.params.id;
      const targetUid = req.params.uid;
      const elderUid = req.user!.uid;
      await circleService.revokeMember(circleId, elderUid, targetUid);
      res.status(200).json({
        success: true,
        data: { message: 'Member access revoked successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const circleController = new CircleController();
