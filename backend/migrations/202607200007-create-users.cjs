'use strict';
module.exports = { async up(q, S) { await q.createTable('users', {
  id: { type: S.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }, username: { type: S.STRING(80), allowNull: false, unique: true },
  password_hash: { type: S.STRING(255), allowNull: false }, role: { type: S.STRING(30), allowNull: false, defaultValue: 'admin' },
  created_at: { type: S.DATE, allowNull: false }, updated_at: { type: S.DATE, allowNull: false },
}); }, async down(q) { await q.dropTable('users'); } };
