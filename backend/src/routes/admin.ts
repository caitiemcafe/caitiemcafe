import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { Op } from 'sequelize';
import { Category, Order, OrderItem, Product, Quote, Setting, User } from '../models/index.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { signAdminToken } from '../utils/auth.js';
import { requireAdmin } from '../middleware/auth.js';
import { categorySchema, generateQuoteSchema, loginSchema, productSchema, quoteSchema, settingsSchema } from '../validation/schemas.js';
import { generateQuotes } from '../services/gemini.js';
import { uploadImage } from '../services/cloudinary.js';

export const adminRouter = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.' } });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, callback) => callback(null, ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype)) });

adminRouter.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await User.findOne({ where: { username: input.username } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không đúng.');
  const token = signAdminToken({ sub: user.id, username: user.username, role: user.role });
  res.json({ success: true, data: { token, user: { id: user.id, username: user.username, role: user.role } } });
}));

adminRouter.use(requireAdmin);

adminRouter.get('/dashboard', asyncHandler(async (_req, res) => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const [orderCount, orderValue, quoteScans, productCount] = await Promise.all([
    Order.count({ where: { createdAt: { [Op.gte]: start } } }),
    Order.sum('totalAmount', { where: { createdAt: { [Op.gte]: start } } }),
    Quote.sum('scanCount'), Product.count({ where: { isActive: true } }),
  ]);
  res.json({ success: true, data: { orderCount, orderValue: Number(orderValue || 0), quoteScans: Number(quoteScans || 0), productCount } });
}));

adminRouter.get('/categories', asyncHandler(async (_req, res) => res.json({ success: true, data: await Category.findAll({ order: [['sortOrder', 'ASC']] }) })));
adminRouter.post('/categories', asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await Category.create(categorySchema.parse(req.body)) })));
adminRouter.put('/categories/:id', asyncHandler(async (req, res) => {
  const row = await Category.findByPk(Number(req.params.id)); if (!row) throw new ApiError(404, 'Không tìm thấy danh mục.');
  await row.update(categorySchema.parse(req.body)); res.json({ success: true, data: row });
}));
adminRouter.delete('/categories/:id', asyncHandler(async (req, res) => {
  const row = await Category.findByPk(Number(req.params.id)); if (!row) throw new ApiError(404, 'Không tìm thấy danh mục.');
  await row.update({ isActive: false }); res.json({ success: true, message: 'Đã ẩn danh mục.' });
}));

adminRouter.get('/products', asyncHandler(async (_req, res) => res.json({ success: true, data: await Product.findAll({ include: [{ model: Category, as: 'category' }], order: [['categoryId', 'ASC'], ['name', 'ASC']] }) })));
adminRouter.post('/products', asyncHandler(async (req, res) => {
  const input = productSchema.parse(req.body);
  res.status(201).json({ success: true, data: await Product.create({ ...input, price: String(input.price) }) });
}));
adminRouter.put('/products/:id', asyncHandler(async (req, res) => {
  const row = await Product.findByPk(Number(req.params.id)); if (!row) throw new ApiError(404, 'Không tìm thấy món.');
  const input = productSchema.parse(req.body); await row.update({ ...input, price: String(input.price) }); res.json({ success: true, data: row });
}));
adminRouter.patch('/products/:id/toggle-stock', asyncHandler(async (req, res) => {
  const row = await Product.findByPk(Number(req.params.id)); if (!row) throw new ApiError(404, 'Không tìm thấy món.');
  await row.update({ isOutOfStock: !row.isOutOfStock }); res.json({ success: true, data: row });
}));
adminRouter.delete('/products/:id', asyncHandler(async (req, res) => {
  const row = await Product.findByPk(Number(req.params.id)); if (!row) throw new ApiError(404, 'Không tìm thấy món.');
  await row.update({ isActive: false }); res.json({ success: true, message: 'Đã ẩn món.' });
}));

adminRouter.get('/orders', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const result = await Order.findAndCountAll({ include: [{ model: OrderItem, as: 'items' }], order: [['createdAt', 'DESC']], limit, offset: (page - 1) * limit, distinct: true });
  res.json({ success: true, data: result.rows, meta: { page, limit, total: result.count, pages: Math.ceil(result.count / limit) } });
}));
adminRouter.get('/orders/:id', asyncHandler(async (req, res) => {
  const row = await Order.findByPk(Number(req.params.id), { include: [{ model: OrderItem, as: 'items' }] }); if (!row) throw new ApiError(404, 'Không tìm thấy đơn hàng.');
  res.json({ success: true, data: row });
}));

adminRouter.get('/quotes', asyncHandler(async (_req, res) => res.json({ success: true, data: await Quote.findAll({ order: [['createdAt', 'DESC']] }) })));
adminRouter.post('/quotes', asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await Quote.create({ ...quoteSchema.parse(req.body), scanCount: 0 }) })));
adminRouter.put('/quotes/:id', asyncHandler(async (req, res) => {
  const row = await Quote.findByPk(Number(req.params.id)); if (!row) throw new ApiError(404, 'Không tìm thấy thông điệp.');
  await row.update(quoteSchema.parse(req.body)); res.json({ success: true, data: row });
}));
adminRouter.delete('/quotes/:id', asyncHandler(async (req, res) => {
  const row = await Quote.findByPk(Number(req.params.id)); if (!row) throw new ApiError(404, 'Không tìm thấy thông điệp.');
  await row.update({ isActive: false }); res.json({ success: true, message: 'Đã ẩn thông điệp.' });
}));
adminRouter.post('/quotes/generate-ai', asyncHandler(async (req, res) => {
  const input = generateQuoteSchema.parse(req.body); const rows = await generateQuotes(input.count, input.topic);
  res.status(201).json({ success: true, data: rows, message: `Đã tạo ${rows.length} thông điệp mới.` });
}));

adminRouter.get('/settings', asyncHandler(async (_req, res) => {
  const rows = await Setting.findAll(); res.json({ success: true, data: Object.fromEntries(rows.map((row) => [row.key, row.value])) });
}));
adminRouter.put('/settings', asyncHandler(async (req, res) => {
  const input = settingsSchema.parse(req.body);
  await Promise.all(Object.entries(input).map(([key, value]) => Setting.upsert({ key, value: String(value) })));
  res.json({ success: true, message: 'Đã lưu cài đặt.' });
}));

adminRouter.post('/upload', upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(422, 'Vui lòng chọn ảnh JPG, PNG, WebP hoặc AVIF dưới 5 MB.');
  res.status(201).json({ success: true, data: { url: await uploadImage(req.file.buffer) } });
}));
