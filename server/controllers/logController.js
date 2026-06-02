/**
 * @fileoverview Audit-log controller.
 * Provides a paginated, filterable view of all mutation logs.
 */

import AuditLog from '../models/AuditLog.js';

/**
 * GET /api/logs
 * Return paginated audit logs with optional filters.
 *
 * Query params:
 *   page, limit, updatedBy (userId), startDate, endDate, action
 */
export const getLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const filter = {
      role: { $regex: /^volunteer$/i }
    };

    // Filter by user who made the change
    if (req.query.updatedBy) {
      filter.updatedBy = req.query.updatedBy;
    }

    // Filter by action type
    if (req.query.action) {
      filter.action = req.query.action;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) {
        filter.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        // Include the entire end day
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('studentId', 'name hallTicketNumber')
        .populate('updatedBy', 'name email')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      logs,
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
