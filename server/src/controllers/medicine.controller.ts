import { Request, Response, NextFunction } from 'express';
import { medicineService } from '../services/medicine.service';
import { medicineRepository } from '../repositories/medicine.repository';
import { AppError } from '../middleware/errorHandler';

export class MedicineController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const circleId = req.params.id;
      const medicines = await medicineService.listMedicines(circleId);
      res.status(200).json({
        success: true,
        data: medicines,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const circleId = req.params.id;
      const callerUid = req.user!.uid;
      const callerRole = req.membership!.role;
      const result = await medicineService.createMedicine(circleId, callerUid, callerRole, req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const medicineId = req.params.id;
      const medicine = await medicineRepository.findById(medicineId);
      if (!medicine) {
        throw new AppError('Medicine not found', 404, 'NOT_FOUND');
      }

      const callerUid = req.user!.uid;
      const callerRole = req.membership!.role;
      const result = await medicineService.updateMedicine(
        medicineId,
        medicine.circleId,
        callerUid,
        callerRole,
        req.body
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const medicineId = req.params.id;
      const medicine = await medicineRepository.findById(medicineId);
      if (!medicine) {
        throw new AppError('Medicine not found', 404, 'NOT_FOUND');
      }

      const callerUid = req.user!.uid;
      const callerRole = req.membership!.role;
      const result = await medicineService.deleteMedicine(
        medicineId,
        medicine.circleId,
        callerUid,
        callerRole
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const medicineId = req.params.id;
      const medicine = await medicineRepository.findById(medicineId);
      if (!medicine) {
        throw new AppError('Medicine not found', 404, 'NOT_FOUND');
      }

      const { quantity } = req.body;
      const result = await medicineService.refillMedicine(medicineId, medicine.circleId, quantity);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const medicineController = new MedicineController();
