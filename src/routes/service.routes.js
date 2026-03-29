// [FIX 2026-03-29] NEW FILE — Service routes with auth + partner role checks
import express from "express";
import { authenticate, authorizeRole } from "../middlewares/auth.middleware.js";
import {
  addService,
  getPartnerServices,
  getMyServices,
  editService,
  removeService,
} from "../controllers/service.controller.js";

const router = express.Router();

// Partner manages their own services
router.post("/", authenticate, authorizeRole("partner"), addService);
router.get("/mine", authenticate, authorizeRole("partner"), getMyServices);
router.put("/:id", authenticate, authorizeRole("partner"), editService);
router.delete("/:id", authenticate, authorizeRole("partner"), removeService);

// Users browse a partner's services (public, but authenticated)
router.get("/partner/:partnerId", authenticate, getPartnerServices);

export default router;
