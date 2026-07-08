import Settings from "../models/Settings.js";
import Student from "../models/Student.js";

// Helper to calculate student phase
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

export const getSettings = async (req, res, next) => {
  try {
    const settingsList = await Settings.find({});
    const settings = {};
    settingsList.forEach(s => {
      settings[s.key] = s.value;
    });
    res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ success: false, message: "Setting key is required" });
    }

    const setting = await Settings.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true }
    );

    // If we updated counselingStartDate, recalculate the phase for all students
    if (key === "counselingStartDate" && value) {
      const students = await Student.find({ isActive: true });
      const bulkOps = students.map(student => {
        const calculatedPhase = calculateStudentPhase(student.createdAt, value);
        return {
          updateOne: {
            filter: { _id: student._id },
            update: { phase: calculatedPhase }
          }
        };
      });

      if (bulkOps.length > 0) {
        await Student.bulkWrite(bulkOps);
      }
    }

    res.status(200).json({
      success: true,
      message: "Setting updated successfully",
      setting
    });
  } catch (error) {
    next(error);
  }
};
