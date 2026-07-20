import { randomBytes } from 'node:crypto';

export interface PricedItem { productId: number; productName: string; quantity: number; unitPrice: number; subtotal: number; notes: string | null }

export function calculateOrder(items: Array<{ id: number; name: string; price: string | number; quantity: number; notes?: string | null }>, shippingFee: number) {
  const pricedItems: PricedItem[] = items.map((item) => {
    const unitPrice = Number(item.price);
    const subtotal = unitPrice * item.quantity;
    return { productId: item.id, productName: item.name, quantity: item.quantity, unitPrice, subtotal, notes: item.notes?.trim() || null };
  });
  const itemsTotal = pricedItems.reduce((sum, item) => sum + item.subtotal, 0);
  return { items: pricedItems, itemsTotal, shippingFee, totalAmount: itemsTotal + shippingFee };
}

export function generateOrderCode(now = new Date()): string {
  const date = now.toISOString().slice(2, 10).replaceAll('-', '');
  return `CT${date}${randomBytes(3).toString('hex').toUpperCase()}`;
}
