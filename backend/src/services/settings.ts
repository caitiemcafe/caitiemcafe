import { Setting } from '../models/index.js';

export const publicKeys = ['shipping_fee', 'shop_name', 'shop_phone', 'shop_address', 'shop_email', 'is_accepting_orders'] as const;

export async function getSettings() {
  const rows = await Setting.findAll({ where: { key: publicKeys } });
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}
