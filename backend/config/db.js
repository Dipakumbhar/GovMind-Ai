const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI must be configured before the API can start');
  }

  let databaseName;
  try {
    databaseName = new URL(uri).pathname.replace(/^\//, '').split('/')[0];
  } catch {
    throw new Error('MONGO_URI is invalid; configure the existing GovMindAI Atlas database');
  }
  if (databaseName !== 'GovMindAI') {
    throw new Error('MONGO_URI must select the existing GovMindAI database');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: false,
    });
    console.log(`MongoDB connected to ${conn.connection.name} on ${conn.connection.host}`);
    return conn;
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
};

module.exports = connectDB;
