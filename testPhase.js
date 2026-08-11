import mongoose from 'mongoose';
import Settings from './server/models/Settings.js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const setting = await Settings.findOne({ key: 'counselingStartDate' });
    console.log('counselingStartDate:', setting?.value);
    
    // Test calculateStudentPhase
    const calculateStudentPhase = (createdAt, startDateString) => {
      if (!startDateString) return "1";
      const start = new Date(startDateString);
      start.setHours(0, 0, 0, 0);
      
      const created = new Date(createdAt);
      created.setHours(0, 0, 0, 0);
      
      const diffTime = created.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return String(Math.max(1, diffDays + 1));
    };
    
    const now = new Date();
    console.log('now:', now.toISOString());
    console.log('phase:', calculateStudentPhase(now, setting?.value));
    
    process.exit(0);
  });
