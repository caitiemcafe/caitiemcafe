import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from '../config/env.js';
import { Quote } from '../models/index.js';
import { ApiError } from '../utils/api-error.js';

const generatedSchema = z.object({ quotes: z.array(z.object({ content: z.string().min(10).max(280), topic: z.string().min(2).max(100) })).min(1).max(20) });

export async function generateQuotes(count: number, topic: string) {
  if (!env.GEMINI_API_KEY) throw new ApiError(503, 'Gemini API chưa được cấu hình.');
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: `Tạo ${count} thông điệp tích cực bằng tiếng Việt, chủ đề ${topic}. Mỗi câu 10-35 từ, tự nhiên, ấm áp, phù hợp hiển thị khi khách quét QR trên ly cà phê. Không dùng nội dung y tế, mê tín, phán xét hoặc hứa hẹn tuyệt đối. Trả về JSON object có key quotes; mỗi phần tử có content và topic.`,
    config: { responseMimeType: 'application/json' },
  });
  const parsed = generatedSchema.parse(JSON.parse(response.text ?? '{}'));
  const existing = await Quote.findAll({ attributes: ['content'] });
  const normalized = new Set(existing.map((quote) => quote.content.trim().toLocaleLowerCase('vi')));
  const unique = parsed.quotes.filter((quote) => !normalized.has(quote.content.trim().toLocaleLowerCase('vi')));
  return Quote.bulkCreate(unique.map((quote) => ({ ...quote, isActive: true, scanCount: 0 })));
}
