import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { ApiError } from '../utils/api-error.js';

export const notFound: RequestHandler = (req, _res, next) => next(new ApiError(404, `Không tìm thấy ${req.method} ${req.path}.`));

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(422).json({ success: false, message: 'Dữ liệu chưa hợp lệ.', errors: error.flatten() });
    return;
  }
  if (error instanceof MulterError) {
    res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 422).json({ success: false, message: error.code === 'LIMIT_FILE_SIZE' ? 'Ảnh vượt quá giới hạn 5 MB.' : 'File upload chưa hợp lệ.' });
    return;
  }
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof ApiError ? error.message : 'Hệ thống đang bận, vui lòng thử lại sau.';
  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({ success: false, message, ...(error instanceof ApiError && error.details ? { errors: error.details } : {}) });
};
