const mongoose = require('mongoose');

const connectDB = async () => {
  if (process.env.USE_MOCK_DB === 'true') {
    console.warn(`\n=============================================================`);
    console.warn(`[DEMO MODE] Activating local JSON database as requested via env!`);
    console.warn(`All database items will be read from/saved to: server/data/db.json`);
    console.warn(`=============================================================\n`);
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      connectTimeoutMS: 2000,
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    process.env.USE_MOCK_DB = 'false';
  } catch (error) {
    console.warn(`\n=============================================================`);
    console.warn(`[WARNING] Remote MongoDB Connection Failed: ${error.message}`);
    console.warn(`[DEMO MODE] Activating local JSON database fallback!`);
    console.warn(`All database items will be saved to: server/data/db.json`);
    console.warn(`=============================================================\n`);
    process.env.USE_MOCK_DB = 'true';
  }
};

module.exports = connectDB;
