'use strict';
module.exports = { async up(q, S) { await q.createTable('products', {
  id: { type: S.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  category_id: { type: S.INTEGER.UNSIGNED, allowNull: false, references: { model: 'categories', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
  name: { type: S.STRING(160), allowNull: false }, slug: { type: S.STRING(180), allowNull: false, unique: true }, description: { type: S.TEXT, allowNull: true },
  price: { type: S.DECIMAL(10, 2), allowNull: false }, image_url: { type: S.STRING(500), allowNull: true }, is_out_of_stock: { type: S.BOOLEAN, allowNull: false, defaultValue: false },
  is_active: { type: S.BOOLEAN, allowNull: false, defaultValue: true }, created_at: { type: S.DATE, allowNull: false }, updated_at: { type: S.DATE, allowNull: false },
}); await q.addIndex('products', ['category_id', 'is_active']); }, async down(q) { await q.dropTable('products'); } };
