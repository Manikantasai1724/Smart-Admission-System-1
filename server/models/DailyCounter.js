import mongoose from 'mongoose';

const dailyCounterSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true, // index by calendar date (YYYY-MM-DD)
  },
  seq: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model('DailyCounter', dailyCounterSchema);
