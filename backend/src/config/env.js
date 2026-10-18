const path = require('node:path');
require('dotenv').config();

const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
if (process.env.NODE_ENV === 'production') {
  for (const name of required) {
    if (!process.env[name] || process.env[name].startsWith('replace-')) throw new Error(`${name} must be configured`);
  }
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lawyers_diary',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  accessSecret: process.env.JWT_ACCESS_SECRET || 'development-access-secret-change-me',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret-change-me',
  accessExpires: process.env.JWT_ACCESS_EXPIRES || '1d',
  refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  uploadDir: path.resolve(process.env.UPLOAD_DIR || 'uploads'),
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'DexFora Platform <dexforaofficial@gmail.com>',
  },
};
