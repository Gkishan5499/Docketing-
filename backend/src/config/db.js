const mongoose = require('mongoose');
const env = require('./env');

async function connectDb() {
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  } catch (error) {
    const connectionHint = env.mongoUri.includes('127.0.0.1') || env.mongoUri.includes('localhost')
      ? ' Start MongoDB locally or set MONGO_URI to a reachable MongoDB/Atlas connection string.'
      : '';
    error.message = `MongoDB connection failed .${connectionHint} Original error: ${error.message}`;
    throw error;
  }
  console.log('MongoDB connected');
}

module.exports = { connectDb };
