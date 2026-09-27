const app = require('./app');
const env = require('./config/env');
const { connectDb } = require('./config/db');
const { startReminderJob } = require('./jobs/reminders');

async function start() {
  try {
    await connectDb();
    startReminderJob();
    app.listen(env.port, () => console.log(`Lawyers Diary API listening on port ${env.port}`));
  } catch (error) {
    console.error(`Unable to start server: ${error.message}`);
    console.error('Setup: copy .env.example to .env, configure MONGO_URI, and ensure MongoDB is running.');
    process.exitCode = 1;
  }
}

start();
