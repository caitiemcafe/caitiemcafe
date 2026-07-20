'use strict';
module.exports = { async up(q, S) { await q.createTable('categories', {
  id: { type: S.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }, name: { type: S.STRING(120), allowNull: false },
  slug: { type: S.STRING(140), allowNull: false, unique: true }, image_url: { type: S.STRING(500), allowNull: true },
  sort_order: { type: S.INTEGER, allowNull: false, defaultValue: 0 }, is_active: { type: S.BOOLEAN, allowNull: false, defaultValue: true },
  created_at: { type: S.DATE, allowNull: false }, updated_at: { type: S.DATE, allowNull: false },
}); }, async down(q) { await q.dropTable('categories'); } };
