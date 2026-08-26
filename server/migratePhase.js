import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/admittrack';

async function run() {
  await mongoose.connect(uri);
  const result = await mongoose.connection.collection('students').updateMany(
    {},
    { $set: { phase: '1' } }
  );
  console.log('Updated students:', result);
  process.exit(0);
}
run().catch(console.error);
