/**
 * @fileoverview Dashboard controller.
 * Provides aggregate statistics and per-department progress data
 * for the HOD dashboard view.
 */

import Student from '../models/Student.js';
import AuditLog from '../models/AuditLog.js';

/**
 * GET /api/dashboard/stats
 * Return overall admission statistics (scoped to the HOD's department
 * by default, or all departments).
 */
export const getStats = async (req, res, next) => {
  try {
    const baseFilter = { isActive: true };

    // Optionally scope to the HOD's department
    if (req.query.department) {
      baseFilter.department = req.query.department;
    }

    // Optionally scope to the counseling day (phase)
    if (req.query.phase) {
      baseFilter.phase = req.query.phase;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // ── Single Pass Aggregation + Parallel Audit Log Query ─────────────
    const overallFilter = { isActive: true };
    if (req.query.department) {
      overallFilter.department = req.query.department;
    }

    const [statsAggregate, recentActivity, overallTotal] = await Promise.all([
      Student.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            totalStudents: { $sum: 1 },
            completedStudents: {
              $sum: { $cond: [{ $eq: ['$currentStep', 5] }, 1, 0] },
            },
            pendingStudents: {
              $sum: { $cond: [{ $and: [{ $gt: ['$currentStep', 0] }, { $lt: ['$currentStep', 5] }] }, 1, 0] },
            },
            selfReportedCount: {
              $sum: { $cond: [{ $gte: ['$currentStep', 1] }, 1, 0] },
            },
            documentsSubmittedCount: {
              $sum: { $cond: [{ $gte: ['$currentStep', 2] }, 1, 0] },
            },
            formFilledCount: {
              $sum: { $cond: [{ $gte: ['$currentStep', 4] }, 1, 0] },
            },
            todayCount: {
              $sum: {
                $cond: [
                  { $gte: ['$completedAt', startOfDay] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      AuditLog.find({})
        .sort({ timestamp: -1 })
        .limit(10)
        .populate('studentId', 'name hallTicketNumber department')
        .populate('updatedBy', 'name email')
        .lean(),
      Student.countDocuments(overallFilter),
    ]);

    const statsData = statsAggregate[0] || {
      totalStudents: 0,
      completedStudents: 0,
      pendingStudents: 0,
      selfReportedCount: 0,
      documentsSubmittedCount: 0,
      formFilledCount: 0,
      todayCount: 0,
    };

    const inProgressStudents = 0; // Deprecated, keeping for UI backward compatibility if needed

    res.status(200).json({
      success: true,
      stats: {
        overallTotal: overallTotal || 0,
        totalStudents: statsData.totalStudents,
        completedStudents: statsData.completedStudents,
        pendingStudents: statsData.pendingStudents,
        inProgressStudents,
        selfReportedCount: statsData.selfReportedCount,
        documentsSubmittedCount: statsData.documentsSubmittedCount,
        formFilledCount: statsData.formFilledCount,
        todayCount: statsData.todayCount,
      },
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/department-progress
 * Return per-department completion breakdown sorted alphabetically.
 */
export const getDepartmentProgress = async (req, res, next) => {
  try {
    const match = { isActive: true };
    if (req.query.phase) {
      match.phase = req.query.phase;
    }

    const progress = await Student.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$currentStep', 5] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $and: [{ $gt: ['$currentStep', 0] }, { $lt: ['$currentStep', 5] }] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          department: '$_id',
          total: 1,
          completed: 1,
          pending: 1,
          inProgress: { $subtract: ['$total', { $add: ['$completed', '$pending'] }] },
          percentage: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ['$completed', '$total'] }, 100] }, 1] },
            ],
          },
        },
      },
      { $sort: { department: 1 } },
    ]);

    res.status(200).json({
      success: true,
      departments: progress,
    });
  } catch (error) {
    next(error);
  }
};
