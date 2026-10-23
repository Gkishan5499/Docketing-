const fs = require('node:fs');
const path = require('node:path');
const { connectDb } = require('../config/db');
const env = require('../config/env');
const {
  Document,
  Matter,
  Client,
  Deadline,
  DocketEvent,
  Hearing,
  Task,
  Note,
  WorkLog,
  LegalNotice,
  Enquiry,
  PaymentRecord,
  Notification,
  AuditLog,
} = require('../models');

async function cleanDataAndFiles() {
  await connectDb();

  console.log('Cleaning database practice data and files...');

  const results = await Promise.all([
    Document.deleteMany({}),
    Matter.deleteMany({}),
    Client.deleteMany({}),
    Deadline.deleteMany({}),
    DocketEvent.deleteMany({}),
    Hearing.deleteMany({}),
    Task.deleteMany({}),
    Note.deleteMany({}),
    WorkLog.deleteMany({}),
    LegalNotice.deleteMany({}),
    Enquiry.deleteMany({}),
    PaymentRecord.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  console.log('Database documents and practice records deleted.');

  // Clean physical files in uploads directory
  if (fs.existsSync(env.uploadDir)) {
    const files = fs.readdirSync(env.uploadDir);
    let deletedCount = 0;
    for (const file of files) {
      if (file === '.gitkeep') continue;
      const fullPath = path.join(env.uploadDir, file);
      try {
        if (fs.statSync(fullPath).isFile()) {
          fs.unlinkSync(fullPath);
          deletedCount++;
        }
      } catch (err) {
        console.warn(`Failed to delete file ${file}:`, err.message);
      }
    }
    console.log(`Deleted ${deletedCount} physical file(s) from ${env.uploadDir}`);
  }

  console.log('Database and disk clean complete.');
  process.exit(0);
}

cleanDataAndFiles().catch((err) => {
  console.error('Error cleaning database and files:', err);
  process.exit(1);
});
