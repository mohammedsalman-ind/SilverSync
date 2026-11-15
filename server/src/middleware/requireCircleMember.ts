import { Request, Response, NextFunction } from 'express';
import { memberRepository } from '../repositories/member.repository';

export async function requireCircleMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const circleId = req.params.id || req.params.circleId;

  if (!circleId) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Circle ID parameter is missing from route.',
      },
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      },
    });
    return;
  }

  try {
    const member = await memberRepository.findMember(circleId, req.user.uid);

    if (!member || member.status !== 'active') {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You are not an active member of this Care Circle.',
        },
      });
      return;
    }

    req.membership = member;
    next();
  } catch (error) {
    next(error);
  }
}
