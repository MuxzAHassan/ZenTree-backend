// [FIX 2026-03-29] Partner routes with geolocation endpoint
import express from "express";
import { authenticate, authorizeRole } from "../middlewares/auth.middleware.js";
import {
  getNearbyPartners,
  getPartnerById,
  updatePartnerProfile,
  updateLocation,
  getActiveStatus,
  toggleActiveStatus,
} from "../controllers/partner.controller.js";

const router = express.Router();

// Users search for nearby partners (with optional ?lat=X&lng=Y)
router.get("/nearby", authenticate, getNearbyPartners);

// Partner gets their current active status
router.get("/active", authenticate, authorizeRole("partner"), getActiveStatus);

// Get specific partner details
router.get("/:id", authenticate, getPartnerById);

// Partner updates their profile
router.put("/profile", authenticate, authorizeRole("partner"), updatePartnerProfile);

// [FIX 2026-03-29] Partner saves GPS location
router.put("/location", authenticate, authorizeRole("partner"), updateLocation);

// Partner toggles active/inactive status
router.put("/active", authenticate, authorizeRole("partner"), toggleActiveStatus);

export default router;
