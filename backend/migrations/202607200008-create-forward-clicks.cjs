'use strict';
module.exports = {
  async up(q, S) {
    await q.createTable('forward_clicks', {
      id: { type: S.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      ip_address: { type: S.STRING(64), allowNull: false },
      user_agent: { type: S.TEXT, allowNull: true },
      referer: { type: S.STRING(500), allowNull: true },
      target_url: { type: S.STRING(500), allowNull: true },
      created_at: { type: S.DATE, allowNull: false },
      updated_at: { type: S.DATE, allowNull: false },
    });
    await q.addIndex('forward_clicks', ['ip_address']);
    await q.addIndex('forward_clicks', ['created_at']);
  },
  async down(q) {
    await q.dropTable('forward_clicks');
  }
};
