import { Setting } from '../models/index.js';

export const publicKeys = [
  'shipping_fee',
  'shop_name',
  'shop_phone',
  'shop_address',
  'shop_email',
  'shop_opening_hours',
  'is_accepting_orders',
  'forward_enabled',
  'forward_seconds',
  'forward_target_url',
  'forward_media_type',
  'forward_media_url',
  'forward_title',
  'forward_description',
  'forward_button_text',
] as const;

export const defaultForwardSettings: Record<string, string> = {
  forward_enabled: 'true',
  forward_seconds: '5',
  forward_target_url: 'https://caitiemkafe.com',
  forward_media_type: 'image',
  forward_media_url: '/images/brand/hero-cafe.webp',
  forward_title: '',
  forward_description: '',
  forward_button_text: 'Chuyển trang ngay',
};

export async function getSettings() {
  const rows = await Setting.findAll({ where: { key: publicKeys } });
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    ...defaultForwardSettings,
    ...map,
  };
}

