import Settings from "../models/Settings.js";
import Student from "../models/Student.js";

// Phase calculation was removed as it collided with the Round concept.

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



    res.status(200).json({
      success: true,
      message: "Setting updated successfully",
      setting
    });
  } catch (error) {
    next(error);
  }
};
