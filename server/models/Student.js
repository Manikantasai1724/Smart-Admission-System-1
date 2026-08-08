/**
 * @fileoverview Student model — central entity of the admission tracker.
 *
 * Each student record tracks three admission steps:
 *   1. selfReported  — student has self-reported online
 *   2. documentsSubmitted — physical documents handed in
 *   3. formFilled — admission form completed
 *
 * A pre-save hook automatically computes completionPercentage and sets
 * completedAt when all three steps are done.
 */

import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    hallTicketNumber: {
      type: String,
      required: [true, "Hall ticket number is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    rank: {
      type: Number,
      required: [true, "Rank is required"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      trim: true,
      default: "",
    },
    caste: {
      type: String,
      trim: true,
      default: "",
    },
    region: {
      type: String,
      trim: true,
      default: "",
    },
    allottedCategory: {
      type: String,
      trim: true,
      default: "",
    },
    phase: {
      type: String,
      trim: true,
      default: "",
    },
    parentName: {
      type: String,
      trim: true,
      default: "",
    },
    parentPhone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    tokenNumber: {
      type: Number,
      default: null,
    },
    tokenGeneratedAt: {
      type: Date,
      default: null,
    },
    tokenDate: {
      type: String,
      default: null,
    },

    // ── Admission step flags ──────────────────────────────────────────
    formIssuing: {
      completed: { type: Boolean, default: false },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      completedAt: { type: Date }
    },
    certificateScan: {
      completed: { type: Boolean, default: false },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      completedAt: { type: Date }
    },
    photoCapture: {
      completed: { type: Boolean, default: false },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      completedAt: { type: Date }
    },
    onlineFormFilling: {
      completed: { type: Boolean, default: false },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      completedAt: { type: Date }
    },
    reportSubmission: {
      completed: { type: Boolean, default: false },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      completedAt: { type: Date }
    },
    currentStep: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    // ── Computed / derived ────────────────────────────────────────────
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedAt: {
      type: Date,
      default: null,
    },


    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Soft-delete flag
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
    optimisticConcurrency: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// hallTicketNumber: unique constraint already defined at field level
studentSchema.index({ rank: 1 });
studentSchema.index({ department: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ name: 1 }); // Regular index for fast prefix regex search
studentSchema.index({ name: "text" }); // text search
studentSchema.index({ tokenNumber: 1 }, { unique: true, sparse: true });
studentSchema.index({ phone: 1 });
studentSchema.index({ parentPhone: 1 });
studentSchema.index({ createdAt: -1 });
studentSchema.index({ completedAt: -1 });
studentSchema.index({ isActive: 1, createdAt: -1 });
studentSchema.index({ isActive: 1, department: 1, phase: 1 });
studentSchema.index({
  isActive: 1,
  currentStep: 1,
});
studentSchema.index({
  department: 1,
  currentStep: 1,
});

// ── Pre-save: compute completionPercentage & completedAt ─────────────────────
studentSchema.pre("save", function preSaveComputeCompletion(next) {
  this.completionPercentage = Math.round((this.currentStep / 5) * 100);

  if (this.currentStep === 5 && !this.completedAt) {
    this.completedAt = new Date();
  } else if (this.currentStep < 5) {
    this.completedAt = null;
  }

  next();
});

const Student = mongoose.model("Student", studentSchema);

export default Student;
