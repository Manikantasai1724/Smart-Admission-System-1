/**
 * @fileoverview AuditLog model — immutable log of every mutation to student
 * records.  Used for accountability, compliance, and the activity feed.
 */

import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    role: {
      type: String,
      trim: true,
    },
    action: {
      type: String,
      required: [true, 'Action type is required'],
      trim: true,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
auditLogSchema.index({ studentId: 1 });
auditLogSchema.index({ updatedBy: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ role: 1, timestamp: -1 });
auditLogSchema.index({ studentId: 1, timestamp: -1 });
auditLogSchema.index({ updatedBy: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
