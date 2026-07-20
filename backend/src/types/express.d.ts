import type { AdminTokenPayload } from '../utils/auth.js';

declare global {
  namespace Express {
    interface Request { admin?: AdminTokenPayload }
  }
}

export {};
