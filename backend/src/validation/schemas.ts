import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
export const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().regex(/^[0-9+().\s-]{8,20}$/, 'Số điện thoại chưa hợp lệ.'),
  customerEmail: z.union([z.string().trim().email().max(254), z.literal(''), z.null()]).optional(),
  customerAddress: z.string().trim().min(5).max(500), notes: optionalText(1000),
  idempotencyKey: z.string().trim().min(8).max(80).optional().nullable(),
  items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(30), notes: optionalText(300) })).min(1).max(30),
});
export const loginSchema = z.object({ username: z.string().trim().min(3).max(80), password: z.string().min(8).max(200) });
export const categorySchema = z.object({ name: z.string().trim().min(2).max(120), slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(140), imageUrl: z.string().url().or(z.literal('')).optional().nullable(), sortOrder: z.number().int().min(0).default(0), isActive: z.boolean().default(true) });
export const productSchema = z.object({ categoryId: z.number().int().positive(), name: z.string().trim().min(2).max(160), slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(180), description: optionalText(2000), price: z.number().min(0).max(100_000_000), imageUrl: z.string().url().or(z.string().startsWith('/')).or(z.literal('')).optional().nullable(), isOutOfStock: z.boolean().default(false), isActive: z.boolean().default(true) });
export const quoteSchema = z.object({ content: z.string().trim().min(10).max(500), topic: optionalText(100), isActive: z.boolean().default(true) });
export const generateQuoteSchema = z.object({ count: z.number().int().min(1).max(20).default(10), topic: z.string().trim().min(2).max(100).default('Cà phê và năng lượng tích cực') });
export const settingsSchema = z.record(z.string().max(100), z.union([z.string().max(4000), z.number(), z.boolean()]));
