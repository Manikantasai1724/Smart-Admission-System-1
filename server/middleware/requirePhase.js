export const requirePhase = (req, res, next) => {
  const phase = req.query.phase || '1';
  // Block mutations for Phase 1
  if (phase === '1' && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    // Allow login to pass through
    if (!req.originalUrl.includes('/api/auth/login')) {
       return res.status(403).json({ success: false, message: "Phase 1 is strictly read-only." });
    }
  }
  next();
};
