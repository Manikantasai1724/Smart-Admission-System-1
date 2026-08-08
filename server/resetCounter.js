import mongoose from 'mongoose';
import config from './config/env.js';
import DailyCounter from './models/DailyCounter.js';

async function resetCounter() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear the daily counters collection
    await DailyCounter.deleteMany({});
    console.log('Successfully cleared all daily token counters (tokens will now start from 1).');
    
  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

resetCounter();
