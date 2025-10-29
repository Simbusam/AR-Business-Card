require('colors');
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      dbName: 'webar' // Explicitly specify the database name
    });
    
    console.log(`MongoDB Connected to database "${conn.connection.name}": ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`Error: ${error.message}`.red.bold);
    process.exit(1);
  }
};


module.exports = connectDB;