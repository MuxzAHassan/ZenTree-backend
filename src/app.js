import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import partnerRoutes from "./routes/partner.routes.js";
// [FIX 2026-03-29] Added service routes for partner service management
import serviceRoutes from "./routes/service.routes.js";
import { swaggerSetup } from "./docs/swagger.js";

const app = express();

// Restricted CORS
app.use(
  cors({
    origin: [
      "http://localhost:8081",
      "http://localhost:19006",
      "http://10.0.2.2:8081",
      "http://192.168.0.7:8081",
      "https://zentree.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many requests, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", apiLimiter, userRoutes);
app.use("/api/bookings", apiLimiter, bookingRoutes);
app.use("/api/partners", apiLimiter, partnerRoutes);
app.use("/api/massagers", apiLimiter, partnerRoutes);
// [FIX 2026-03-29] Service management routes
app.use("/api/services", apiLimiter, serviceRoutes);

swaggerSetup(app);

// Global error handler
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === "development") console.error("Unhandled error:", err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal server error" });
});

export default app;
