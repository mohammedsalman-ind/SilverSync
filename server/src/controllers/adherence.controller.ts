import { Request, Response, NextFunction } from 'express';
import { adherenceService } from '../services/adherence.service';

export class AdherenceController {
  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const circleId = req.params.id;
      const metrics = await adherenceService.getAdherenceMetrics(circleId);
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adherenceController = new AdherenceController();
