'use strict';
module.exports = { async up(q, S) { await q.createTable('order_items', {
  id: { type: S.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  order_id: { type: S.INTEGER.UNSIGNED, allowNull: false, references: { model: 'orders', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
  product_id: { type: S.INTEGER.UNSIGNED, allowNull: true, references: { model: 'products', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
  product_name: { type: S.STRING(160), allowNull: false }, quantity: { type: S.INTEGER.UNSIGNED, allowNull: false }, unit_price: { type: S.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: S.DECIMAL(10, 2), allowNull: false }, notes: { type: S.TEXT, allowNull: true }, created_at: { type: S.DATE, allowNull: false }, updated_at: { type: S.DATE, allowNull: false },
}); await q.addIndex('order_items', ['order_id']); }, async down(q) { await q.dropTable('order_items'); } };
