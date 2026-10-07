import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { Op, QueryTypes } from 'sequelize';
import { Category, ForwardClick, Order, OrderItem, Product, Quote, Setting, User } from '../models/index.js';
import { sequelize } from '../config/database.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { signAdminToken } from '../utils/auth.js';
import { requireAdmin } from '../middleware/auth.js';
import { categorySchema, generateQuoteSchema, loginSchema, productSchema, quoteSchema, settingsSchema } from '../validation/schemas.js';
import { fetchModels, generateQuotes, testAIConnection } from '../services/ai.js';
import { uploadImage } from '../services/cloudinary.js';
import { defaultForwardSettings } from '../services/settings.js';

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
  const rows = await Setting.findAll();
  res.json({ success: true, data: { ...defaultForwardSettings, ...Object.fromEntries(rows.map((row) => [row.key, row.value])) } });
}));
adminRouter.put('/settings', asyncHandler(async (req, res) => {
  const input = settingsSchema.parse(req.body);
  await Promise.all(Object.entries(input).map(([key, value]) => Setting.upsert({ key, value: String(value) })));
  res.json({ success: true, message: 'Đã lưu cài đặt.' });
}));

adminRouter.post('/ai/models', asyncHandler(async (req, res) => {
  const { provider = 'gemini', apiKey = '', proxyUrl = '' } = req.body || {};
  const models = await fetchModels(String(provider), String(apiKey), String(proxyUrl));
  res.json({ success: true, data: models });
}));

adminRouter.post('/ai/test', asyncHandler(async (req, res) => {
  const { provider = 'gemini', apiKey = '', proxyUrl = '', model = '', prompt = '' } = req.body || {};
  const result = await testAIConnection(
    {
      provider: provider as any,
      apiKey: String(apiKey),
      proxyUrl: String(proxyUrl),
      model: String(model),
    },
    String(prompt || '')
  );
  res.json({ success: true, data: result, message: 'Kết nối AI thành công!' });
}));

adminRouter.post('/upload', upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(422, 'Vui lòng chọn ảnh JPG, PNG, WebP hoặc AVIF dưới 5 MB.');
  res.status(201).json({ success: true, data: { url: await uploadImage(req.file.buffer, req.file.originalname) } });
}));

adminRouter.get('/forward/stats', asyncHandler(async (req, res) => {
  let startDate: Date;
  let endDate: Date;

  const monthParam = typeof req.query.month === 'string' && req.query.month.match(/^\d{4}-\d{2}$/) ? req.query.month : null;
  const fromParam = typeof req.query.from === 'string' && req.query.from.match(/^\d{4}-\d{2}-\d{2}$/) ? req.query.from : null;
  const toParam = typeof req.query.to === 'string' && req.query.to.match(/^\d{4}-\d{2}-\d{2}$/) ? req.query.to : null;

  if (fromParam && toParam) {
    startDate = new Date(`${fromParam}T00:00:00.000Z`);
    endDate = new Date(`${toParam}T23:59:59.999Z`);
  } else if (monthParam) {
    const [y, m] = monthParam.split('-').map(Number);
    startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
    endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
  } else {
    const now = new Date();
    startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
    endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
  }

  const wherePeriod = {
    createdAt: {
      [Op.between]: [startDate, endDate],
    },
  };

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const [totalClicks, uniqueIpsResult, recentClicksResult] = await Promise.all([
    ForwardClick.count({ where: wherePeriod }),
    ForwardClick.count({ distinct: true, col: 'ipAddress', where: wherePeriod }),
    ForwardClick.findAndCountAll({
      where: wherePeriod,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    }),
  ]);

  const dailyRaw = await sequelize.query<{ date: string; clicks: number; uniqueIps: number }>(
    `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as clicks, COUNT(DISTINCT ip_address) as uniqueIps
     FROM forward_clicks
     WHERE created_at BETWEEN :startDate AND :endDate
     GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
     ORDER BY date ASC`,
    {
      replacements: { startDate, endDate },
      type: QueryTypes.SELECT,
    }
  );

  const topIpsRaw = await sequelize.query<{ ipAddress: string; clicks: number; lastClick: string }>(
    `SELECT ip_address as ipAddress, COUNT(*) as clicks, MAX(created_at) as lastClick
     FROM forward_clicks
     WHERE created_at BETWEEN :startDate AND :endDate
     GROUP BY ip_address
     ORDER BY clicks DESC
     LIMIT 10`,
    {
      replacements: { startDate, endDate },
      type: QueryTypes.SELECT,
    }
  );

  res.json({
    success: true,
    data: {
      filter: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
        month: monthParam || `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
      },
      summary: {
        totalClicks,
        uniqueIps: Number(uniqueIpsResult || 0),
      },
      dailyStats: dailyRaw,
      topIps: topIpsRaw,
      recentClicks: recentClicksResult.rows,
      meta: {
        page,
        limit,
        total: recentClicksResult.count,
        pages: Math.ceil(recentClicksResult.count / limit),
      },
    },
  });
}));

