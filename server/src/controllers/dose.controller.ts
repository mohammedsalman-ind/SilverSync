import { Request, Response, NextFunction } from 'express';
import { doseService } from '../services/dose.service';
import { doseLogRepository } from '../repositories/doseLog.repository';
import { AppError } from '../middleware/errorHandler';

export class DoseController {
  async getToday(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const circleId = req.params.id;
      const timezone = (req.query.timezone as string) || 'Asia/Kolkata';
      const doses = await doseService.getTodayDoses(circleId, timezone);
      res.status(200).json({
        success: true,
        data: doses,
      });
    } catch (error) {
      next(error);
    }
  }

  async logDose(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logId = req.params.id;
      const log = await doseLogRepository.findById(logId);
      if (!log) {
        throw new AppError('Dose log record not found', 404, 'NOT_FOUND');
      }

      const callerUid = req.user!.uid;
      const { status } = req.body;
      const updated = await doseService.logDose(logId, log.circleId, callerUid, status);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const doseController = new DoseController();
