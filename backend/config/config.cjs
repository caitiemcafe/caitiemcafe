require('dotenv').config();

const shared = {
  dialect: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'cai_tiem_cafe',
  username: process.env.DB_USER || 'cafe_app',
  password: process.env.DB_PASSWORD || '',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  define: { underscored: true, timestamps: true },
};

module.exports = { development: shared, test: shared, production: shared };
