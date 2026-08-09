/**
 * @fileoverview Rate-limiting middleware to protect sensitive endpoints
 * (e.g. login) from brute-force attacks.
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints.
 * Allows 10 requests per 15-minute window per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,  // Disable X-RateLimit-* headers
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});
