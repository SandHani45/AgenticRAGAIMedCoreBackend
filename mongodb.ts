import mongoose from 'mongoose';

let isConnected = false;

export async function connectMongoDB(): Promise<boolean> {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    
    if (!mongoUrl) {
      console.log('🔄 No MongoDB URL provided, falling back to local storage');
      return false;
    }

    if (isConnected) {
      return true;
    }

    await mongoose.connect(mongoUrl, {
      bufferCommands: false,
    });

    isConnected = true;
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed, falling back to local storage:', error);
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}