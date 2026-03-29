// [FIX 2026-03-29] Updated user routes with push token save endpoint
import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { getProfile } from "../controllers/user.controller.js";
import { savePushToken } from "../controllers/notification.controller.js";

const router = express.Router();

// Protected routes
router.get("/profile", authenticate, getProfile);

// [FIX 2026-03-29] Save push notification token
router.post("/push-token", authenticate, savePushToken);

export default router;
