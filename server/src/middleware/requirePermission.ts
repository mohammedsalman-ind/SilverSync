import { Request, Response, NextFunction } from 'express';
import { Permission } from '../types';

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const member = req.membership;

    if (!member) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Circle membership context is missing.',
        },
      });
      return;
    }

    if (member.role === 'ELDER') {
      next();
      return;
    }

    if (member.permissions && member.permissions.includes(permission)) {
      next();
      return;
    }

    res.status(403).json({
      error: {
        code: 'PERMISSION_DENIED',
        message: `Action requires '${permission}' permission.`,
      },
    });
  };
}

export function requireElder(req: Request, res: Response, next: NextFunction): void {
  const member = req.membership;

  if (!member) {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Circle membership context is missing.',
      },
    });
    return;
  }

  if (member.role !== 'ELDER') {
    res.status(403).json({
      error: {
        code: 'PERMISSION_DENIED',
        message: 'This operation is restricted to the Elder of this Care Circle.',
      },
    });
    return;
  }

  next();
}
