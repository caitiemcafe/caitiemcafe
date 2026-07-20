import { Op, UniqueConstraintError } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Order, OrderItem, Product, Setting } from '../models/index.js';
import { ApiError } from '../utils/api-error.js';
import { calculateOrder, generateOrderCode } from '../utils/order.js';

export interface CreateOrderInput {
  customerName: string; customerPhone: string; customerEmail?: string | null; customerAddress: string;
  notes?: string | null; idempotencyKey?: string | null;
  items: Array<{ productId: number; quantity: number; notes?: string | null }>;
}

export async function createOrder(input: CreateOrderInput) {
  if (input.idempotencyKey) {
    const existing = await Order.findOne({ where: { idempotencyKey: input.idempotencyKey }, include: [{ model: OrderItem, as: 'items' }] });
    if (existing) return { order: existing, duplicated: true };
  }
  const accepting = await Setting.findByPk('is_accepting_orders');
  if (accepting?.value === 'false') throw new ApiError(409, 'Quán đang tạm ngừng nhận đơn.');
  const ids = [...new Set(input.items.map((item) => item.productId))];
  const products = await Product.findAll({ where: { id: { [Op.in]: ids }, isActive: true, isOutOfStock: false } });
  if (products.length !== ids.length) throw new ApiError(409, 'Có món đã ngừng bán hoặc hết hàng. Vui lòng cập nhật giỏ hàng.');
  const productMap = new Map(products.map((product) => [product.id, product]));
  const pricingInput = input.items.map((item) => {
    const product = productMap.get(item.productId)!;
    return { id: product.id, name: product.name, price: product.price, quantity: item.quantity, notes: item.notes };
  });
  const shipping = await Setting.findByPk('shipping_fee');
  const shippingFee = Math.max(0, Number(shipping?.value ?? 0) || 0);
  const priced = calculateOrder(pricingInput, shippingFee);
  let order: Order;
  try {
    order = await sequelize.transaction(async (transaction) => {
      const created = await Order.create({
        orderCode: generateOrderCode(), customerName: input.customerName.trim(), customerPhone: input.customerPhone.trim(),
        customerEmail: input.customerEmail?.trim() || null, customerAddress: input.customerAddress.trim(), notes: input.notes?.trim() || null,
        shippingFee: String(priced.shippingFee), totalAmount: String(priced.totalAmount), paymentMethod: 'COD', idempotencyKey: input.idempotencyKey || null,
      }, { transaction });
      await OrderItem.bulkCreate(priced.items.map((item) => ({ orderId: created.id, productId: item.productId, productName: item.productName, quantity: item.quantity, unitPrice: String(item.unitPrice), subtotal: String(item.subtotal), notes: item.notes })), { transaction });
      return created;
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError && input.idempotencyKey) {
      const existing = await Order.findOne({ where: { idempotencyKey: input.idempotencyKey }, include: [{ model: OrderItem, as: 'items' }] });
      if (existing) return { order: existing, duplicated: true };
    }
    throw error;
  }
  const fullOrder = await Order.findByPk(order.id, { include: [{ model: OrderItem, as: 'items' }] });
  return { order: fullOrder!, duplicated: false };
}
