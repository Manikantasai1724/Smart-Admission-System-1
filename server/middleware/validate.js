/**
 * @fileoverview Request validation middleware using express-validator.
 * Provides reusable validation chains and a generic error formatter.
 */

import { body, validationResult } from "express-validator";

/**
 * Validation rules for the login endpoint.
 * @type {import('express-validator').ValidationChain[]}
 */
export const validateLogin = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * Generic middleware that inspects express-validator results.
 * Returns a 400 response with a structured errors array when validation fails.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};
