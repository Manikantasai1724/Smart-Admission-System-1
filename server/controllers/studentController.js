/**
 * @fileoverview Student controller — CRUD and bulk-upload operations.
 */

import fs from "fs";
import Student from "../models/Student.js";
import AuditLog from "../models/AuditLog.js";
import DailyCounter from "../models/DailyCounter.js";
import { parseFile } from "../services/fileParser.js";
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
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20),
    );
    const skip = (page - 1) * limit;

    // ── Base filter: only active students ──────────────────────────
    const filter = { isActive: true };

    // Department filter
    if (req.query.department) {
      filter.department = { $regex: `^${req.query.department}$`, $options: "i" };
    }

    // Status filter
    if (req.query.status) {
      switch (req.query.status) {
        case "completed":
          filter.selfReported = true;
          filter.documentsSubmitted = true;
          filter.formFilled = true;
          break;
        case "pending":
          filter.$or = [
            { selfReported: false },
            { documentsSubmitted: false },
            { formFilled: false }
          ];
          break;
        case "in-progress":
          filter.$expr = {
            $and: [
              {
                $gt: [
                  {
                    $add: [
                      { $cond: ["$selfReported", 1, 0] },
                      { $cond: ["$documentsSubmitted", 1, 0] },
                      { $cond: ["$formFilled", 1, 0] },
                    ],
                  },
                  0,
                ],
              },
              {
                $lt: [
                  {
                    $add: [
                      { $cond: ["$selfReported", 1, 0] },
                      { $cond: ["$documentsSubmitted", 1, 0] },
                      { $cond: ["$formFilled", 1, 0] },
                    ],
                  },
                  3,
                ],
              },
            ],
          };
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

    // Phone filter (studentPhone or parentPhone)
    if (req.query.phone) {
      const phoneRegex = { $regex: req.query.phone, $options: "i" };
      filter.$or = [
        { studentPhone: phoneRegex },
        { parentPhone: phoneRegex },
        ...(filter.$or || []),
      ];
    }

    // Token number filter
    if (req.query.tokenNumber) {
      const tokenNum = parseInt(req.query.tokenNumber, 10);
      if (!Number.isNaN(tokenNum)) {
        filter.tokenNumber = tokenNum;
      }
    }

    // Text / regex search
    const searchQuery = req.query.search || req.query.query;
    if (searchQuery) {
      const searchFilter = buildSearchQuery(searchQuery);
      if (searchFilter.$or) {
        filter.$or = searchFilter.$or;
      }
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("uploadedBy", "name email")
        .lean(),
      Student.countDocuments(filter),
    ]);

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
 * Update a student's admission-step flags and/or remarks.
 */
export const updateStudentStatus = async (req, res, next) => {
  try {
    const { selfReported, documentsSubmitted, formFilled, remarks } = req.body;

    const student = await Student.findById(req.params.id);

    if (!student || !student.isActive) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // Capture old values for the audit trail
    const oldValue = {
      selfReported: student.selfReported,
      documentsSubmitted: student.documentsSubmitted,
      formFilled: student.formFilled,
      remarks: student.remarks,
    };

    // Apply updates (only overwrite fields that were explicitly sent)
    if (selfReported !== undefined) student.selfReported = selfReported;
    if (documentsSubmitted !== undefined)
      student.documentsSubmitted = documentsSubmitted;
    if (formFilled !== undefined) student.formFilled = formFilled;
    if (remarks !== undefined) student.remarks = remarks;

    await student.save(); // triggers pre-save hook → completionPercentage

    const newValue = {
      selfReported: student.selfReported,
      documentsSubmitted: student.documentsSubmitted,
      formFilled: student.formFilled,
      remarks: student.remarks,
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
    const students = await Student.find(filter)
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name email")
      .lean();
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
    };

    // Calculate calendar date local format (YYYY-MM-DD)
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Atomically find and increment/create sequence
    const counter = await DailyCounter.findOneAndUpdate(
      { date: dateStr },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const tokenNumber = counter.seq;

    // Apply updates
    student.phone = phone;
    student.parentPhone = parentPhone;
    student.tokenNumber = tokenNumber;
    student.tokenGeneratedAt = new Date();

    await student.save();

    const newValue = {
      phone: student.phone,
      parentPhone: student.parentPhone,
      tokenNumber: student.tokenNumber,
      tokenGeneratedAt: student.tokenGeneratedAt,
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
