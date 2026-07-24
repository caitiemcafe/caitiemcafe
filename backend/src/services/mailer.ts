import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { Setting, type Order, type OrderItem } from '../models/index.js';

type OrderWithItems = Order & { items?: OrderItem[] };
const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);
}

function orderHtml(order: OrderWithItems, heading: string) {
  const rows = (order.items ?? []).map((item) => `<tr><td style="padding:8px 0">${escapeHtml(item.productName)} × ${item.quantity}${item.notes ? `<br><small>${escapeHtml(item.notes)}</small>` : ''}</td><td style="text-align:right">${money.format(Number(item.subtotal))}</td></tr>`).join('');
  return `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#2b211b"><h1 style="color:#6f3d24">${heading}</h1><p><b>Mã đơn:</b> ${escapeHtml(order.orderCode)}</p><p><b>Khách:</b> ${escapeHtml(order.customerName)} — ${escapeHtml(order.customerPhone)}</p><p><b>Địa chỉ:</b> ${escapeHtml(order.customerAddress)}</p>${order.notes ? `<p><b>Ghi chú:</b> ${escapeHtml(order.notes)}</p>` : ''}<table style="width:100%;border-collapse:collapse">${rows}<tr style="border-top:1px solid #ddd"><td style="padding-top:12px"><b>Tổng cộng</b></td><td style="padding-top:12px;text-align:right"><b>${money.format(Number(order.totalAmount))}</b></td></tr></table><p style="margin-top:24px;color:#6b625d">Cảm ơn bạn đã chọn Cái Tiệm.</p></div>`;
}

function createTransporter() {
  if (!env.SMTP_USER || !env.SMTP_PASS) return null;
  return nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_SECURE, auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } });
}

export async function sendOrderEmails(order: OrderWithItems) {
  const mailer = createTransporter();
  if (!mailer) {
    console.warn('[mail] SMTP chưa được cấu hình; đơn vẫn được lưu:', order.orderCode);
    return { shop: false, customer: false };
  }
  const from = `"${env.SMTP_FROM_NAME}" <${env.SMTP_USER}>`;
  let shop = false;
  let customer = false;
  const jobs: Promise<void>[] = [];

  const shopEmailSetting = await Setting.findByPk('shop_email');
  const recipientShopEmail = shopEmailSetting?.value?.trim() || env.SHOP_ORDER_EMAIL;

  if (recipientShopEmail) {
    jobs.push(mailer.sendMail({ from, to: recipientShopEmail, subject: `Đơn hàng mới ${order.orderCode}`, html: orderHtml(order, 'Có đơn hàng mới') }).then(() => { shop = true }));
  }
  if (order.customerEmail) {
    jobs.push(mailer.sendMail({ from, to: order.customerEmail, subject: `Cái Tiệm đã nhận đơn ${order.orderCode}`, html: orderHtml(order, 'Đặt hàng thành công!') }).then(() => { customer = true }));
  }
  const results = await Promise.allSettled(jobs);
  results.filter((result) => result.status === 'rejected').forEach((result) => console.error('[mail] Gửi email thất bại:', result.reason));
  return { shop, customer };
}
