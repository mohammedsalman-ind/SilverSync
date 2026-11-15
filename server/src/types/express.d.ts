import { CircleMember } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
      };
      membership?: CircleMember;
    }
  }
}
