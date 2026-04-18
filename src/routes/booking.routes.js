// [FIX 2026-03-29] NEW FILE — Booking routes with auth + validation (#16)
import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateBooking } from "../middlewares/validate.middleware.js";
import {
  bookMassager,
  getMyBookings,
  getPartnerBookings,
  getBooking,
  changeBookingStatus,
} from "../controllers/booking.controller.js";

const router = express.Router();

// [FIX 2026-03-29] All booking routes require authentication (#16)
router.post("/", authenticate, validateBooking, bookMassager);
router.get("/", authenticate, getMyBookings);
router.get("/partner", authenticate, getPartnerBookings);
router.get("/:id", authenticate, getBooking);
router.put("/:id/status", authenticate, changeBookingStatus);

export default router;
