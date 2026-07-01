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

    // Enforce department scope for Volunteers, or check query param for others
    if (req.user && req.user.role && req.user.role.toLowerCase() === 'volunteer') {
      baseFilter.department = { $regex: `^${req.user.department}$`, $options: "i" };
    } else if (req.query.department) {
      baseFilter.department = req.query.department;
    }

    // ── Aggregate counts ──────────────────────────────────────────
    const [
      totalStudents,
      completedStudents,
      pendingStudents,
      selfReportedCount,
      documentsSubmittedCount,
      formFilledCount,
      todayCount,
    ] = await Promise.all([
      Student.countDocuments(baseFilter),
      Student.countDocuments({
        ...baseFilter,
        selfReported: true,
        documentsSubmitted: true,
        formFilled: true,
      }),
      Student.countDocuments({
        ...baseFilter,
        $or: [
          { selfReported: false },
          { documentsSubmitted: false },
          { formFilled: false },
        ]
      }),
      Student.countDocuments({ ...baseFilter, selfReported: true }),
      Student.countDocuments({ ...baseFilter, documentsSubmitted: true }),
      Student.countDocuments({ ...baseFilter, formFilled: true }),
      (() => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return Student.countDocuments({
          ...baseFilter,
          completedAt: { $gte: startOfDay },
        });
      })(),
    ]);

    const inProgressStudents = 0; // Deprecated, keeping for UI backward compatibility if needed

    // ── Recent activity ───────────────────────────────────────────
    let activityFilter = {};
    if (baseFilter.department) {
      const studentIds = await Student.find({
        department: baseFilter.department,
        isActive: true
      }).distinct('_id');
      activityFilter.studentId = { $in: studentIds };
    }

    const recentActivity = await AuditLog.find(activityFilter)
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('studentId', 'name hallTicketNumber department')
      .populate('updatedBy', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        completedStudents,
        pendingStudents,
        inProgressStudents,
        selfReportedCount,
        documentsSubmittedCount,
        formFilledCount,
        todayCount,
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
    const progress = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$selfReported', true] },
                    { $eq: ['$documentsSubmitted', true] },
                    { $eq: ['$formFilled', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          pending: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$selfReported', false] },
                    { $eq: ['$documentsSubmitted', false] },
                    { $eq: ['$formFilled', false] },
                  ],
                },
                1,
                0,
              ],
            },
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
