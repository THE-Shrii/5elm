const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is provided
    if (!process.env.MONGODB_URI) {
      console.error('❌ MongoDB connection failed: MONGODB_URI environment variable is required');
      console.log('💡 Please set MONGODB_URI in your Render environment variables');
      console.log('🚀 Server will continue running in limited mode (no database features)');
      return false;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    return true;

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('💡 Make sure your MongoDB URI is correct and accessible from Render');
    console.log('🚀 Server will continue running in limited mode (no database features)');
    return false;
  }
};

module.exports = connectDB;
