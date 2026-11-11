require('dotenv').config();
const mongoose = require('mongoose');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing. Check your .env file.');
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Could not connect to MongoDB:', error.message);
    throw error;
  }
}

module.exports = connectDatabase;