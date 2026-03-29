// [FIX 2026-03-29] NEW FILE — Input validation middleware using express-validator (#7)
// Provides reusable validation chains for signup and login routes

import { body, validationResult } from "express-validator";

// [FIX 2026-03-29] Centralized validation error handler — returns first error per field
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

// [FIX 2026-03-29] Signup validation rules — validates all required fields (#7)
export const validateSignup = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required"),
  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required"),
  body("gender")
    .trim()
    .notEmpty()
    .withMessage("Gender is required"),
  body("dateOfBirth")
    .notEmpty()
    .withMessage("Date of birth is required"),
  body("role")
    .optional()
    .isIn(["user", "partner"])
    .withMessage("Role must be 'user' or 'partner'"),
  handleValidationErrors,
];

// [FIX 2026-03-29] Login validation rules (#7)
export const validateLogin = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  handleValidationErrors,
];

// [FIX 2026-03-29] Booking validation rules (#7, #16)
export const validateBooking = [
  body("massagerId")
    .notEmpty()
    .withMessage("Massager ID is required"),
  body("serviceType")
    .trim()
    .notEmpty()
    .withMessage("Service type is required"),
  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .isISO8601()
    .withMessage("Date must be in YYYY-MM-DD format"),
  body("time")
    .trim()
    .notEmpty()
    .withMessage("Time is required"),
  handleValidationErrors,
];
