/**
 * @fileoverview Student controller — CRUD and bulk-upload operations.
 */

import fs from "fs";
import Student from "../models/Student.js";
import AuditLog from "../models/AuditLog.js";
import DailyCounter from "../models/DailyCounter.js";
import Settings from "../models/Settings.js";
import { parseFile } from "../services/fileParser.js";

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
import { bulkInsertStudents } from "../services/studentService.js";
import {
  emitStudentUpdate,
  emitDashboardRefresh,
  emitNewActivity,
} from "../services/socketService.js";
import { buildSearchQuery } from "../utils/helpers.js";

/**
 * GET /api/students
 * Return a paginated, filterable, searchable list of active students.
 *
 * Query params:
 *   page, limit, department, status (completed|pending|in-progress), query
 */
export const getStudents = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      5000,
      Math.max(1, parseInt(req.query.limit, 10) || 20),
    );
    const skip = (page - 1) * limit;

    // ── Base filter: only active students ──────────────────────────
    const filter = { isActive: true };

    // Default department filter for Volunteer and HOD accounts
    if (req.user && req.user.department && req.user.department !== "ALL" && !req.query.department) {
      filter.department = req.user.department;
    }

    // Department filter
    if (req.query.department) {
      filter.department = req.query.department;
    }

    // Phase / Counseling Day filter
    if (req.query.phase) {
      filter.phase = req.query.phase;
    }

    // Status filter
    if (req.query.status) {
      switch (req.query.status) {
        case "completed":
          filter.currentStep = 5;
          break;
        case "pending":
          filter.currentStep = { $gt: 0, $lt: 5 };
          break;
        default:
          break;
      }
    }

    // Rank filter (rankMin and rankMax)
    if (req.query.rankMin || req.query.rankMax) {
      filter.rank = {};
      if (req.query.rankMin) {
        const rankMin = parseInt(req.query.rankMin, 10);
        if (!Number.isNaN(rankMin)) {
          filter.rank.$gte = rankMin;
        }
      }
      if (req.query.rankMax) {
        const rankMax = parseInt(req.query.rankMax, 10);
        if (!Number.isNaN(rankMax)) {
          filter.rank.$lte = rankMax;
        }
      }
    }

    // Phone filter (phone or parentPhone)
    if (req.query.phone) {
      const escapedPhone = req.query.phone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const phoneRegex = { $regex: `^${escapedPhone}`, $options: "i" };
      filter.$or = [
        { phone: phoneRegex },
        { parentPhone: phoneRegex },
        ...(filter.$or || []),
      ];
    }

    // Token number filter
    if (req.query.tokenNumber) {
      const cleanTokenStr = String(req.query.tokenNumber).trim().replace(/^#/, "").replace(/\D/g, "");
      const tokenNum = parseInt(cleanTokenStr, 10);
      if (!Number.isNaN(tokenNum)) {
        filter.tokenNumber = tokenNum;
        
        // Scope search to tokenDate only if explicitly provided in query params
        if (req.query.tokenDate) {
          filter.tokenDate = req.query.tokenDate;
        }
      }
    }

    // Text / regex search
    const searchQuery = req.query.search || req.query.query;
    if (searchQuery) {
      const searchFilter = buildSearchQuery(searchQuery);
      if (searchFilter.rank !== undefined) {
        filter.rank = searchFilter.rank;
      } else if (searchFilter.$or) {
        filter.$or = searchFilter.$or;
      }
    }

    const [rawStudents, total] = await Promise.all([
      Student.find(filter)
        .skip(skip)
        .limit(limit)
        .populate("uploadedBy", "name email")
        .lean(),
      Student.countDocuments(filter),
    ]);

    // Default sort: tokenNumber ascending (#1, #2, #3...), non-tokenized students afterwards
    const students = rawStudents.sort((a, b) => {
      const aTok = a.tokenNumber;
      const bTok = b.tokenNumber;
      if (aTok !== null && aTok !== undefined && bTok !== null && bTok !== undefined) {
        return aTok - bTok;
      }
      if (aTok !== null && aTok !== undefined) return -1;
      if (bTok !== null && bTok !== undefined) return 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    res.status(200).json({
      success: true,
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/:id
 * Fetch a single student with upload user info and recent audit logs.
 */
export const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("uploadedBy", "name email")
      .lean();

    if (!student || !student.isActive) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // Fetch recent audit logs for this student
    const auditLogs = await AuditLog.find({ studentId: student._id })
      .sort({ timestamp: -1 })
      .limit(20)
      .populate("updatedBy", "name email")
      .lean();

    res.status(200).json({
      success: true,
      student,
      auditLogs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/students/upload
 * Accept a file upload (.xlsx, .csv, .pdf), parse it, and bulk-insert
 * new student records.  Skips duplicates by hallTicketNumber.
 */
export const uploadStudents = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please attach an xlsx, csv, or pdf file.",
      });
    }

    const filePath = req.file.path;
    const mimetype = req.file.mimetype;

    let parsedStudents;
    try {
      parsedStudents = await parseFile(filePath, mimetype);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: `File parsing failed: ${parseError.message}`,
      });
    }

    // Attempt to clean up the uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignore cleanup errors
    }

    if (!parsedStudents || parsedStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid student records found in the uploaded file.",
      });
    }

    const { inserted, skipped, errors, invalidRows } = await bulkInsertStudents(
      parsedStudents,
      req.user.id,
      req.user.role
    );

    if (inserted > 0) {
      // Real-time notification
      emitDashboardRefresh();
    }

    res.status(201).json({
      success: true,
      message: "File processed successfully.",
      totalRecords: parsedStudents.length,
      inserted,
      skipped,
      invalidRows,
      errors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/students/:id/status
 * Update a student's admission-step flags.
 */
export const updateStudentStatus = async (req, res, next) => {
  try {
    const { currentStep } = req.body;

    const student = await Student.findById(req.params.id);

    if (!student || !student.isActive) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const oldValue = {
      currentStep: student.currentStep,
    };

    // Apply updates (only overwrite fields that were explicitly sent)
    if (currentStep !== undefined) {
      student.currentStep = currentStep;
      
      const now = new Date();
      const updateStep = (stepObj, stepName, isCompleted) => {
        if (isCompleted && !stepObj.completed) {
          stepObj.completed = true;
          stepObj.completedAt = now;
          stepObj.completedBy = req.user.id;
          student.markModified(stepName);
        } else if (!isCompleted && stepObj.completed) {
          stepObj.completed = false;
          stepObj.completedAt = undefined;
          stepObj.completedBy = undefined;
          student.markModified(stepName);
        }
      };

      updateStep(student.formIssuing, 'formIssuing', currentStep >= 1);
      updateStep(student.certificateScan, 'certificateScan', currentStep >= 2);
      updateStep(student.photoCapture, 'photoCapture', currentStep >= 3);
      updateStep(student.onlineFormFilling, 'onlineFormFilling', currentStep >= 4);
      updateStep(student.reportSubmission, 'reportSubmission', currentStep >= 5);
    }

    await student.save(); // triggers pre-save hook → completionPercentage

    const newValue = {
      currentStep: student.currentStep,
    };

    // Audit log
    const auditLog = await AuditLog.create({
      studentId: student._id,
      updatedBy: req.user.id,
      role: req.user.role,
      action: "STATUS_UPDATE",
      oldValue,
      newValue,
    });

    // Real-time events
    emitStudentUpdate(student.toObject());
    emitDashboardRefresh();
    emitNewActivity(auditLog.toObject());

    res.status(200).json({
      success: true,
      message: "Student status updated successfully.",
      student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/students/:id
 * Soft-delete a student (sets isActive = false).
 */
export const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student || !student.isActive) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    student.isActive = false;
    await student.save();

    // Audit log
    await AuditLog.create({
      studentId: student._id,
      updatedBy: req.user.id,
      role: req.user.role,
      action: "STUDENT_DELETED",
      oldValue: { isActive: true },
      newValue: { isActive: false },
    });

    emitDashboardRefresh();

    res.status(200).json({
      success: true,
      message: "Student deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/export/all
 * Fetch all students without pagination.
 */
export const exportStudents = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.department) {
      filter.department = { $regex: `^${req.query.department}$`, $options: "i" };
    }
    if (req.query.phase) {
      filter.phase = req.query.phase;
    }
    const rawStudents = await Student.find(filter)
      .populate("uploadedBy", "name email")
      .lean();

    const students = rawStudents.sort((a, b) => {
      const aTok = a.tokenNumber;
      const bTok = b.tokenNumber;
      if (aTok !== null && aTok !== undefined && bTok !== null && bTok !== undefined) {
        return aTok - bTok;
      }
      if (aTok !== null && aTok !== undefined) return -1;
      if (bTok !== null && bTok !== undefined) return 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    res.status(200).json({
      success: true,
      students,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/students/bulk/all
 * Delete all students from the database.
 */
export const deleteAllStudents = async (req, res, next) => {
  try {
    await Student.deleteMany({});
    await AuditLog.deleteMany({}); // optionally clear student audit logs
    await DailyCounter.deleteMany({}); // Clear daily counters as well
    emitDashboardRefresh();
    res.status(200).json({
      success: true,
      message: "All students deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/students/:id/generate-token
 * Generate a daily resetting token number for a student and update phone numbers.
 */
export const generateStudentToken = async (req, res, next) => {
  try {
    const { phone, parentPhone } = req.body;

    if (!phone || !parentPhone) {
      return res.status(400).json({
        success: false,
        message: "Both student and parent phone numbers are required.",
      });
    }

    const student = await Student.findById(req.params.id);
    if (!student || !student.isActive) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // Capture old values for audit
    const oldValue = {
      phone: student.phone,
      parentPhone: student.parentPhone,
      tokenNumber: student.tokenNumber,
      tokenGeneratedAt: student.tokenGeneratedAt,
      tokenDate: student.tokenDate,
    };

    // Get current date in YYYY-MM-DD format (IST / India Timezone)
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayStr = formatter.format(new Date());

    // Check if a token was already generated
    if (student.tokenNumber) {
      return res.status(400).json({
        success: false,
        message: "Student already has a token number.",
      });
    }

    // Atomically find and increment global sequence (never resets when day changes)
    let counter = await DailyCounter.findOneAndUpdate(
      { date: "GLOBAL" },
      { $inc: { seq: 1 } },
      { new: true }
    );

    // If global counter entry does not exist yet, initialize it using max existing tokenNumber
    if (!counter) {
      const maxStudent = await Student.findOne({ tokenNumber: { $ne: null } })
        .sort({ tokenNumber: -1 })
        .select("tokenNumber")
        .lean();
      const initialSeq = maxStudent && typeof maxStudent.tokenNumber === "number" ? maxStudent.tokenNumber + 1 : 1;

      counter = await DailyCounter.findOneAndUpdate(
        { date: "GLOBAL" },
        { $setOnInsert: { seq: initialSeq } },
        { new: true, upsert: true }
      );
    }

    const tokenNumber = counter.seq;

    // Apply updates
    student.phone = phone;
    student.parentPhone = parentPhone;
    student.tokenNumber = tokenNumber;
    student.tokenGeneratedAt = new Date();
    student.tokenDate = todayStr;
    
    // Update student's phase to the current counseling day based on visit date
    const counselingSetting = await Settings.findOne({ key: "counselingStartDate" });
    if (counselingSetting?.value) {
      student.phase = calculateStudentPhase(new Date(), counselingSetting.value);
    }
    
    if (student.currentStep === 0) {
      student.currentStep = 1;
      student.formIssuing = {
        completed: true,
        completedBy: req.user.id,
        completedAt: new Date()
      };
    }

    await student.save();

    const newValue = {
      phone: student.phone,
      parentPhone: student.parentPhone,
      tokenNumber: student.tokenNumber,
      tokenGeneratedAt: student.tokenGeneratedAt,
      tokenDate: student.tokenDate,
    };

    // Audit log
    const auditLog = await AuditLog.create({
      studentId: student._id,
      updatedBy: req.user.id,
      role: req.user.role,
      action: "TOKEN_GENERATED",
      oldValue,
      newValue,
    });

    // Real-time events
    emitStudentUpdate(student.toObject());
    emitDashboardRefresh();
    emitNewActivity(auditLog.toObject());

    res.status(200).json({
      success: true,
      message: `Token #${tokenNumber} generated successfully.`,
      student,
    });
  } catch (error) {
    next(error);
  }
};
