'use strict';
module.exports = { async up(q, S) { await q.createTable('quotes', {
  id: { type: S.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }, content: { type: S.TEXT, allowNull: false }, topic: { type: S.STRING(100), allowNull: true },
  scan_count: { type: S.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 }, is_active: { type: S.BOOLEAN, allowNull: false, defaultValue: true },
  created_at: { type: S.DATE, allowNull: false }, updated_at: { type: S.DATE, allowNull: false },
}); await q.addIndex('quotes', ['is_active']); }, async down(q) { await q.dropTable('quotes'); } };
