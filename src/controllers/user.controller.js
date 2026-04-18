// [FIX 2026-03-29] Import getUserById to fetch full profile from DB
// instead of returning JWT decoded data (which only has id, email, role) (#17)
import { getUserById } from "../models/user.model.js";

export const getProfile = async (req, res) => {
  try {
    // req.user comes from auth.middleware.js (JWT decoded payload)
    // [FIX 2026-03-29] Fetch full user profile from DB instead of returning JWT data
    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // [FIX 2026-03-29] Standardized response format with success: true (#10)
    res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      user,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Profile fetch error:", error.message);
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
