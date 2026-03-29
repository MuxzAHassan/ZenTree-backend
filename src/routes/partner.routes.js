// [FIX 2026-03-29] Partner routes with geolocation endpoint
import express from "express";
import { authenticate, authorizeRole } from "../middlewares/auth.middleware.js";
import {
  getNearbyPartners,
  getPartnerById,
  updatePartnerProfile,
  updateLocation,
} from "../controllers/partner.controller.js";

const router = express.Router();

// Users search for nearby partners (with optional ?lat=X&lng=Y)
router.get("/nearby", authenticate, getNearbyPartners);

// Get specific partner details
router.get("/:id", authenticate, getPartnerById);

// Partner updates their profile
router.put("/profile", authenticate, authorizeRole("partner"), updatePartnerProfile);

// [FIX 2026-03-29] Partner saves GPS location
router.put("/location", authenticate, authorizeRole("partner"), updateLocation);

export default router;
