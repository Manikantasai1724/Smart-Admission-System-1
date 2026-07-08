/**
 * @fileoverview Main entry point for the Smart Admission Tracking &
 * Verification System backend.
 *
 * Responsibilities:
 *   1. Load environment config
 *   2. Create Express app with security & logging middleware
 *   3. Mount API routes
 *   4. Attach global error handler
 *   5. Create HTTP server + Socket.IO
 *   6. Connect to MongoDB
 *   7. Start listening
 */

import http from 'http';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import config from './config/env.js';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import { initializeSocket } from './services/socketService.js';

// ── Route imports ────────────────────────────────────────────────────────────
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import logRoutes from './routes/logRoutes.js';
import userRoutes from './routes/userRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

// ── Ensure uploads directory exists ──────────────────────────────────────────
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}

// ── Express app ──────────────────────────────────────────────────────────────
const app = express();

// ── Global middleware ────────────────────────────────────────────────────────
app.use(
  cors({
    origin: '*', // tighten for production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Admission Tracking API is running 🚀',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── HTTP server + Socket.IO ──────────────────────────────────────────────────
const server = http.createServer(app);
const io = initializeSocket(server);

// ── Start ────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await connectDB();

    server.listen(config.PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════');
      console.log('  🎓 Smart Admission Tracking & Verification System');
      console.log(`  🚀 Server running on port ${config.PORT}`);
      console.log(`  🌍 Environment: ${config.NODE_ENV}`);
      console.log(`  📡 API base: http://localhost:${config.PORT}/api`);
      console.log('═══════════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

start();

// Export for testing
export { app, io };
