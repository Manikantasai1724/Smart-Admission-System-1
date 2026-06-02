/**
 * @fileoverview Dashboard routes — HOD-only aggregate endpoints.
 */

import { Router } from 'express';
import { getStats, getDepartmentProgress } from '../controllers/dashboardController.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/rbac.js';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Overall admission statistics.
 */
router.get('/stats', auth, authorize('HOD', 'Volunteer'), getStats);

/**
 * GET /api/dashboard/department-progress
 * Per-department completion breakdown.
 */
router.get('/department-progress', auth, authorize('HOD', 'Volunteer'), getDepartmentProgress);

export default router;
