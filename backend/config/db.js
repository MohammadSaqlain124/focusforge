// config/db.js
// Purpose: Connects our Express app to MongoDB Atlas using Mongoose.
// Why separate file: Keeps server.js clean. Single Responsibility Principle.

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // mongoose.connect returns a promise; we await it
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    // Log success — helpful for debugging deployment issues
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If connection fails, log error and crash the app
    // (no point running a server without a database)
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1); // exit with failure code
  }
};

module.exports = connectDB;