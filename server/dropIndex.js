import mongoose from 'mongoose';
import config from './config/env.js';

async function dropIndex() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Drop the specific index
    try {
      await mongoose.connection.collection('students').dropIndex('tokenNumber_1');
      console.log('Successfully dropped tokenNumber_1 index');
    } catch (err) {}

    try {
      await mongoose.connection.collection('students').dropIndex('hallTicketNumber_1');
      console.log('Successfully dropped hallTicketNumber_1 index');
    } catch (err) {}

    try {
      await mongoose.connection.collection('students').dropIndex('email_1');
      console.log('Successfully dropped email_1 index');
    } catch (err) {}
    
    try {
      await mongoose.connection.collection('users').dropIndex('email_1');
      console.log('Successfully dropped email_1 index from users');
    } catch (err) {}
    
  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

dropIndex();
