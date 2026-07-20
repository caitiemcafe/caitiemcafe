import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from '../config/env.js';
import { Quote, Setting } from '../models/index.js';
import { ApiError } from '../utils/api-error.js';

export interface AIConfig {
  provider: 'gemini' | 'openai' | 'claude' | 'openrouter' | 'custom';
  apiKey: string;
  proxyUrl?: string;
  model: string;
}

const DEFAULT_MODELS: Record<string, string[]> = {
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o3-mini'],
  claude: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'aws/claude-haiku-4-5'],
  openrouter: ['google/gemini-2.5-flash', 'anthropic/claude-3.5-haiku', 'openai/gpt-4o-mini', 'meta-llama/llama-3.3-70b-instruct'],
  custom: ['gpt-4o-mini', 'gpt-4o', 'claude-3-5-haiku', 'gemini-2.5-flash'],
};

export async function getAIConfig(): Promise<AIConfig> {
  const rows = await Setting.findAll();
  const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  const provider = (settings.ai_provider || 'gemini') as AIConfig['provider'];
  const apiKey = settings.ai_api_key || env.GEMINI_API_KEY || '';
  const proxyUrl = settings.ai_proxy_url || '';
  const model = settings.ai_model || (provider === 'gemini' ? (env.GEMINI_MODEL || 'gemini-2.5-flash') : DEFAULT_MODELS[provider]?.[0] || 'gpt-4o-mini');

  return { provider, apiKey, proxyUrl, model };
}

export async function fetchModels(provider: string, apiKey?: string, proxyUrl?: string): Promise<string[]> {
  const defaults = DEFAULT_MODELS[provider] || DEFAULT_MODELS.gemini;
  const effectiveKey = apiKey || env.GEMINI_API_KEY;

  if (!effectiveKey && !proxyUrl) return defaults;

  try {
    if (provider === 'gemini') {
      const url = proxyUrl
        ? `${proxyUrl.replace(/\/+$/, '')}/models?key=${effectiveKey}`
        : `https://generativelanguage.googleapis.com/v1beta/models?key=${effectiveKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as { models?: Array<{ name: string }> };
        if (data.models && Array.isArray(data.models)) {
          const names = data.models
            .map((m) => m.name.replace(/^models\//, ''))
            .filter((name) => name.includes('gemini'));
          if (names.length > 0) return names;
        }
      }
    } else {
      // OpenAI / OpenRouter / Claude / Custom (OpenAI compatible)
      let baseUrl = proxyUrl?.replace(/\/+$/, '');
      if (!baseUrl) {
        if (provider === 'openai') baseUrl = 'https://api.openai.com/v1';
        else if (provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1';
        else if (provider === 'claude') baseUrl = 'https://api.anthropic.com/v1';
        else baseUrl = 'https://api.openai.com/v1';
      }

      const res = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${effectiveKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = (await res.json()) as { data?: Array<{ id: string }> };
        if (data.data && Array.isArray(data.data)) {
          const ids = data.data.map((m) => m.id);
          if (ids.length > 0) return ids.slice(0, 30);
        }
      }
    }
  } catch (err) {
    console.warn('[AI] Failed to fetch dynamic models from remote API, falling back to defaults:', err);
  }

  return defaults;
}

export async function generateAIResponse(
  prompt: string,
  overrideConfig?: Partial<AIConfig>
): Promise<{ text: string; model: string }> {
  const currentConfig = await getAIConfig();
  const config: AIConfig = {
    provider: overrideConfig?.provider || currentConfig.provider,
    apiKey: overrideConfig?.apiKey !== undefined ? overrideConfig.apiKey : currentConfig.apiKey,
    proxyUrl: overrideConfig?.proxyUrl !== undefined ? overrideConfig.proxyUrl : currentConfig.proxyUrl,
    model: overrideConfig?.model || currentConfig.model,
  };

  if (!config.apiKey && !config.proxyUrl) {
    throw new ApiError(503, 'Chưa cấu hình API Key cho AI. Vui lòng nhập API Key trong phần Cài đặt.');
  }

  // 1. Google Gemini via Official SDK (when no proxyUrl is used)
  if (config.provider === 'gemini' && !config.proxyUrl) {
    const ai = new GoogleGenAI({ apiKey: config.apiKey });
    const response = await ai.models.generateContent({
      model: config.model || 'gemini-2.5-flash',
      contents: prompt,
    });
    return { text: response.text || '', model: config.model };
  }

  // 2. OpenAI / OpenRouter / Claude / Custom or Proxy URL (OpenAI-compatible REST API)
  let baseUrl = config.proxyUrl?.replace(/\/+$/, '');
  if (!baseUrl) {
    if (config.provider === 'openai') baseUrl = 'https://api.openai.com/v1';
    else if (config.provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1';
    else if (config.provider === 'claude') baseUrl = 'https://api.anthropic.com/v1';
    else baseUrl = 'https://api.openai.com/v1';
  }

  const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      ...(config.provider === 'openrouter' ? { 'HTTP-Referer': 'https://caitiemcafe.com', 'X-Title': 'Cai Tiem Cafe' } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    let msg = `Yêu cầu AI thất bại (HTTP ${res.status})`;
    try {
      const errJson = JSON.parse(errText);
      msg = errJson.error?.message || errJson.message || msg;
    } catch {
      if (errText) msg = `${msg}: ${errText.slice(0, 150)}`;
    }
    throw new ApiError(res.status === 401 ? 401 : 502, `Lỗi nhà cung cấp AI (${config.provider}): ${msg}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const reply = data.choices?.[0]?.message?.content || '';
  return { text: reply.trim(), model: config.model };
}

export async function testAIConnection(config: AIConfig, prompt?: string) {
  const testPrompt = prompt || 'Hãy phản hồi 1 câu ngắn dễ thương chào mừng khách hàng ghé Cái Tiệm Café.';
  const start = Date.now();
  const result = await generateAIResponse(testPrompt, config);
  const latencyMs = Date.now() - start;
  return { ...result, latencyMs };
}

const generatedSchema = z.object({
  quotes: z.array(z.object({ content: z.string().min(10).max(280), topic: z.string().min(2).max(100) })).min(1).max(20),
});

export async function generateQuotes(count: number, topic: string) {
  const prompt = `Tạo ${count} thông điệp tích cực bằng tiếng Việt, chủ đề ${topic}. Mỗi câu 10-35 từ, tự nhiên, ấm áp, phù hợp hiển thị khi khách quét QR trên ly cà phê. Không dùng nội dung y tế, mê tín, phán xét hoặc hứa hẹn tuyệt đối. Trả về đúng 1 chuỗi định dạng JSON object có duy nhất 1 key là "quotes"; mỗi phần tử có "content" và "topic". Chỉ trả về JSON không kèm Markdown hay văn bản khác.`;

  const { text } = await generateAIResponse(prompt);

  // Extract json string from possible codeblock wrappers
  let cleanText = text.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  }

  const parsed = generatedSchema.parse(JSON.parse(cleanText));
  const existing = await Quote.findAll({ attributes: ['content'] });
  const normalized = new Set(existing.map((quote) => quote.content.trim().toLocaleLowerCase('vi')));
  const unique = parsed.quotes.filter((quote) => !normalized.has(quote.content.trim().toLocaleLowerCase('vi')));

  return Quote.bulkCreate(unique.map((quote) => ({ ...quote, isActive: true, scanCount: 0 })));
}
