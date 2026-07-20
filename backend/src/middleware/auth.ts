import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/api-error.js';
import { verifyAdminToken } from '../utils/auth.js';

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) return next(new ApiError(401, 'Bạn cần đăng nhập quản trị.'));
  try {
    const payload = verifyAdminToken(header.slice(7));
    if (payload.role !== 'admin') return next(new ApiError(403, 'Bạn không có quyền thực hiện thao tác này.'));
    req.admin = payload;
    next();
  } catch {
    next(new ApiError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'));
  }
}
