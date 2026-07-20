'use strict';
module.exports = { async up(q, S) { await q.createTable('orders', {
  id: { type: S.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }, order_code: { type: S.STRING(32), allowNull: false, unique: true },
  customer_name: { type: S.STRING(120), allowNull: false }, customer_phone: { type: S.STRING(20), allowNull: false }, customer_email: { type: S.STRING(254), allowNull: true },
  customer_address: { type: S.TEXT, allowNull: false }, notes: { type: S.TEXT, allowNull: true }, shipping_fee: { type: S.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  total_amount: { type: S.DECIMAL(10, 2), allowNull: false }, payment_method: { type: S.STRING(20), allowNull: false, defaultValue: 'COD' },
  idempotency_key: { type: S.STRING(80), allowNull: true, unique: true }, created_at: { type: S.DATE, allowNull: false }, updated_at: { type: S.DATE, allowNull: false },
}); await q.addIndex('orders', ['created_at']); }, async down(q) { await q.dropTable('orders'); } };
