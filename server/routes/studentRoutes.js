/**
 * @fileoverview Student routes with file-upload support via multer.
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getStudents,
  getStudentById,
  uploadStudents,
  updateStudentStatus,
  deleteStudent,
  exportStudents,
  deleteAllStudents,
  generateStudentToken,
} from '../controllers/studentController.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/rbac.js';

// ── Multer configuration ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, 'uploads/');
  },
  filename(_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

/**
 * File filter — only allow .xlsx, .csv, .pdf uploads.
 */
const fileFilter = (_req, file, cb) => {
  const allowedExtensions = ['.xlsx', '.xls', '.csv', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
    'application/pdf',
  ];

  if (allowedExtensions.includes(ext) || allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only .xlsx, .csv, and .pdf files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// ── Router ───────────────────────────────────────────────────────────────────
const router = Router();

/**
 * GET /api/students
 * Paginated student list (all authenticated users).
 */
router.get('/', auth, getStudents);

/**
 * GET /api/students/export/all
 * Export all students without pagination (HOD and Admin).
 */
router.get('/export/all', auth, authorize('HOD', 'Admin'), exportStudents);

/**
 * GET /api/students/:id
 * Single student detail (all authenticated users).
 */
router.get('/:id', auth, getStudentById);

/**
 * POST /api/students/upload
 * Bulk upload students from file (HOD only).
 */
router.post('/upload', auth, authorize('Admin'), upload.single('file'), uploadStudents);

/**
 * PUT /api/students/:id/status
 * Update admission-step flags (Volunteer only).
 */
router.put('/:id/status', auth, authorize('Volunteer'), updateStudentStatus);

/**
 * POST /api/students/:id/generate-token
 * Generate a token number (Volunteer only).
 */
router.post('/:id/generate-token', auth, authorize('Volunteer'), generateStudentToken);

/**
 * DELETE /api/students/bulk/all
 * Hard-delete all students (Admin only).
 */
router.delete('/bulk/all', auth, authorize('Admin'), deleteAllStudents);

/**
 * DELETE /api/students/:id
 * Soft-delete a student (HOD only).
 */
router.delete('/:id', auth, authorize('HOD'), deleteStudent);

export default router;
