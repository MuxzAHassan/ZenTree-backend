import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { getProfile } from "../controllers/user.controller.js";

const router = express.Router();

// Protected route
router.get("/profile", authenticate, getProfile);

export default router;
