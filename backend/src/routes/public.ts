import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Category, Product, Quote } from '../models/index.js';
import { asyncHandler } from '../utils/async-handler.js';
import { orderSchema } from '../validation/schemas.js';
import { createOrder } from '../services/orders.js';
import { sendOrderEmails } from '../services/mailer.js';
import { getSettings } from '../services/settings.js';
import { sequelize } from '../config/database.js';
import { ApiError } from '../utils/api-error.js';

export const publicRouter = Router();
const orderLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Bạn đặt hàng quá nhanh. Vui lòng thử lại sau ít phút.' } });
const vibeLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Bạn đã rút khá nhiều thông điệp. Hãy nghỉ một chút nhé.' } });

publicRouter.get('/categories', asyncHandler(async (_req, res) => {
  const categories = await Category.findAll({ where: { isActive: true }, order: [['sortOrder', 'ASC'], ['name', 'ASC']] });
  res.json({ success: true, data: categories });
}));

publicRouter.get('/products', asyncHandler(async (req, res) => {
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
  const products = await Product.findAll({
    where: { isActive: true, ...(categoryId && Number.isInteger(categoryId) ? { categoryId } : {}) },
    include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }], order: [['categoryId', 'ASC'], ['name', 'ASC']],
  });
  res.json({ success: true, data: products });
}));

publicRouter.get('/settings/public', asyncHandler(async (_req, res) => res.json({ success: true, data: await getSettings() })));

publicRouter.post('/orders', orderLimiter, asyncHandler(async (req, res) => {
  const input = orderSchema.parse(req.body);
  const result = await createOrder(input);
  if (!result.duplicated) {
    try { await sendOrderEmails(result.order); }
    catch (error) { console.error('[mail] Không thể gửi email cho đơn', result.order.orderCode, error); }
  }
  res.status(result.duplicated ? 200 : 201).json({
    success: true,
    message: 'Đặt hàng thành công! Quán sẽ sớm liên hệ và giao món cho bạn.',
    data: { orderCode: result.order.orderCode, totalAmount: Number(result.order.totalAmount), duplicated: result.duplicated },
  });
}));

publicRouter.get('/vibe/random', vibeLimiter, asyncHandler(async (_req, res) => {
  const count = await Quote.count({ where: { isActive: true } });
  if (!count) throw new ApiError(404, 'Chưa có thông điệp nào. Hãy quay lại sau nhé.');
  const quote = await sequelize.transaction(async (transaction) => {
    const offset = Math.floor(Math.random() * count);
    const selected = await Quote.findOne({ where: { isActive: true }, order: [['id', 'ASC']], offset, transaction });
    if (!selected) throw new ApiError(404, 'Chưa có thông điệp nào.');
    await selected.increment('scanCount', { by: 1, transaction });
    return selected;
  });
  res.json({ success: true, data: { id: quote.id, content: quote.content, topic: quote.topic } });
}));
