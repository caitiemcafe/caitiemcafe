import 'dotenv/config';
import { z } from 'zod';

const booleanString = (fallback: 'true' | 'false') => z.enum(['true', 'false']).default(fallback).transform((value) => value === 'true');
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3003),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().default('cai_tiem_cafe'),
  DB_USER: z.string().default('cafe_app'),
  DB_PASSWORD: z.string().default(''),
  DB_LOGGING: booleanString('false'),
  JWT_SECRET: z.string().min(32).default('development-only-secret-change-me-now'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  SHOP_ORDER_EMAIL: z.string().default(''),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_SECURE: booleanString('true'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM_NAME: z.string().default('Cái Tiệm'),
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
});

export const env = schema.parse(process.env);
