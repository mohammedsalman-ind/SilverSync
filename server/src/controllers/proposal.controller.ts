import { Request, Response, NextFunction } from 'express';
import { proposalService } from '../services/proposal.service';

export class ProposalController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const circleId = req.params.id;
      const proposals = await proposalService.listPending(circleId);
      res.status(200).json({
        success: true,
        data: proposals,
      });
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const proposalId = req.params.id;
      const elderUid = req.user!.uid;
      const result = await proposalService.approve(proposalId, elderUid);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const proposalId = req.params.id;
      const elderUid = req.user!.uid;
      const result = await proposalService.reject(proposalId, elderUid);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const proposalController = new ProposalController();
