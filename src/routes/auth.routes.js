// [FIX 2026-03-29] Updated auth routes to use input validation middleware (#7)
import express from "express";
import { signup, login } from "../controllers/auth.controller.js";
import { validateSignup, validateLogin } from "../middlewares/validate.middleware.js";

const router = express.Router();

// [FIX 2026-03-29] Added validation middleware before controller handlers (#7)
router.post("/signup", validateSignup, signup);
router.post("/login", validateLogin, login);

export default router;
