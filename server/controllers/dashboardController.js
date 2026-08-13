/**
 * @fileoverview Dashboard controller.
 * Provides aggregate statistics and per-department progress data
 * for the HOD dashboard view.
 */

import Student from '../models/Student.js';
import AuditLog from '../models/AuditLog.js';
import Settings from '../models/Settings.js';

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
      baseFilter.department = { $regex: `^${req.query.department}$`, $options: "i" };
    }

    // Optionally scope to the counseling day (phase)
    // We will dynamically filter by tokenGeneratedAt instead of the phase string field

    let targetDate = new Date();
    if (req.query.phase) {
      const counselingSetting = await Settings.findOne({ key: "counselingStartDate" });
      if (counselingSetting?.value) {
        const startDate = new Date(counselingSetting.value);
        targetDate = new Date(startDate);
        targetDate.setDate(startDate.getDate() + (Number(req.query.phase) - 1));
      }
    }

    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const targetDateStr = formatter.format(targetDate);
    const startOfDay = new Date(`${targetDateStr}T00:00:00+05:30`);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Apply the dynamic tokenGeneratedAt filter for the specific phase
    if (req.query.phase) {
      baseFilter.tokenGeneratedAt = { $gte: startOfDay, $lt: endOfDay };
    }

    // ── Single Pass Aggregation + Parallel Audit Log Query ─────────────
    const overallFilter = { isActive: true };
    if (req.query.department) {
      overallFilter.department = { $regex: `^${req.query.department}$`, $options: "i" };
    }

    const overallCompletedFilter = { isActive: true, currentStep: 5 };
    if (req.query.department) {
      overallCompletedFilter.department = { $regex: `^${req.query.department}$`, $options: "i" };
    }

    const [statsAggregate, recentActivity, overallTotal, overallCompleted] = await Promise.all([
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
            pendingToday: {
              $sum: { 
                $cond: [
                  { 
                    $and: [
                      { $gt: ['$currentStep', 0] }, 
                      { $lt: ['$currentStep', 5] },
                      { $gte: ['$tokenGeneratedAt', startOfDay] },
                      { $lt: ['$tokenGeneratedAt', endOfDay] }
                    ] 
                  }, 
                  1, 
                  0
                ] 
              },
            },
            completedToday: {
              $sum: { 
                $cond: [
                  { 
                    $and: [
                      { $eq: ['$currentStep', 5] },
                      { $gte: ['$completedAt', startOfDay] },
                      { $lt: ['$completedAt', endOfDay] }
                    ]
                  }, 
                  1, 
                  0
                ] 
              },
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
                  { 
                    $and: [
                      { $gte: ['$completedAt', startOfDay] },
                      { $lt: ['$completedAt', endOfDay] }
                    ]
                  },
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
      Student.countDocuments(overallCompletedFilter),
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
        overallCompleted: overallCompleted || 0,
        totalStudents: statsData.totalStudents,
        completedStudents: statsData.completedStudents,
        pendingStudents: statsData.pendingStudents,
        pendingToday: statsData.pendingToday || 0,
        completedToday: statsData.completedToday || 0,
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
      const counselingSetting = await Settings.findOne({ key: "counselingStartDate" });
      if (counselingSetting?.value) {
        const startDate = new Date(counselingSetting.value);
        const targetDate = new Date(startDate);
        targetDate.setDate(startDate.getDate() + (Number(req.query.phase) - 1));
        
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        const targetDateStr = formatter.format(targetDate);
        const startOfDay = new Date(`${targetDateStr}T00:00:00+05:30`);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);
        
        match.tokenGeneratedAt = { $gte: startOfDay, $lt: endOfDay };
      }
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
