'use strict';
module.exports = { async up(q, S) { await q.createTable('settings', {
  key: { type: S.STRING(100), primaryKey: true }, value: { type: S.TEXT, allowNull: false }, created_at: { type: S.DATE, allowNull: false }, updated_at: { type: S.DATE, allowNull: false },
}); }, async down(q) { await q.dropTable('settings'); } };
