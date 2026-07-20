import { describe, expect, it } from 'vitest';
import { calculateOrder, generateOrderCode } from './order.js';
import { orderSchema } from '../validation/schemas.js';
import { escapeHtml } from '../services/mailer.js';

describe('calculateOrder', () => {
  it('tính giá từ dữ liệu sản phẩm phía server', () => {
    const result = calculateOrder([
      { id: 1, name: 'Cà phê sữa đá', price: '15000', quantity: 2 },
      { id: 2, name: 'Bạc xỉu', price: 20000, quantity: 1, notes: 'Ít ngọt' },
    ], 5000);
    expect(result.itemsTotal).toBe(50000);
    expect(result.totalAmount).toBe(55000);
    expect(result.items[1].notes).toBe('Ít ngọt');
  });

  it('tạo mã đơn không chứa ký tự hiển thị thừa', () => {
    expect(generateOrderCode(new Date('2026-07-20T00:00:00Z'))).toMatch(/^CT260720[A-F0-9]{6}$/);
  });
});

describe('email safety', () => {
  it('escape nội dung HTML do khách nhập', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  });
});

describe('order validation', () => {
  it('chấp nhận email trống', () => {
    const result = orderSchema.safeParse({ customerName: 'Nguyễn Văn A', customerPhone: '0912345678', customerEmail: '', customerAddress: '123 Đường A', items: [{ productId: 1, quantity: 1 }] });
    expect(result.success).toBe(true);
  });

  it('từ chối email sai và số lượng vượt giới hạn', () => {
    const result = orderSchema.safeParse({ customerName: 'Nguyễn Văn A', customerPhone: '0912345678', customerEmail: 'sai-email', customerAddress: '123 Đường A', items: [{ productId: 1, quantity: 100 }] });
    expect(result.success).toBe(false);
  });
});
