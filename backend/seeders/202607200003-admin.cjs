'use strict';
const bcrypt = require('bcryptjs');
module.exports = { async up(q) {
  const username = process.env.ADMIN_USERNAME; const password = process.env.ADMIN_PASSWORD;
  if (!username || !password || password === 'replace_before_seeding') { console.warn('[seed] Bỏ qua admin: cần ADMIN_USERNAME và ADMIN_PASSWORD production-safe.'); return; }
  const now = new Date(); await q.bulkInsert('users', [{ username, password_hash: await bcrypt.hash(password, 12), role: 'admin', created_at: now, updated_at: now }]);
}, async down(q) { if (process.env.ADMIN_USERNAME) await q.bulkDelete('users', { username: process.env.ADMIN_USERNAME }, {}); } };
