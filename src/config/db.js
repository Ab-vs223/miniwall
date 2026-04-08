'use strict';

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`[DB] Connection error: ${err.message}`);
    process.exit(1); // non-zero exit -> Docker restart policy triggers
  }
};

module.exports = connectDB;
