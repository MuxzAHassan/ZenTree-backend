// [FIX 2026-03-29] Rewritten — Partner controller with Haversine distance-based search
import pool from "../config/db.js";

// [FIX 2026-03-29] Haversine formula to calculate distance between two GPS coordinates (in km)
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// [FIX 2026-03-29] Get partners sorted by distance from user's location
export const getNearbyPartners = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    // Fetch all partners with location set
    const { rows } = await pool.query(
      `SELECT u.id, u."firstName", u."lastName", u.email, u.phone, u.gender,
              u.latitude, u.longitude,
              COUNT(s.id) AS "serviceCount"
       FROM "User" u
       LEFT JOIN "Service" s ON s."partnerId" = u.id AND s."isActive" = true
       WHERE u.role = 'partner' AND u."isActive" = true AND u.latitude IS NOT NULL AND u.longitude IS NOT NULL
       GROUP BY u.id
       ORDER BY u."firstName" ASC`
    );

    // If user sent their GPS coords, calculate distance and sort by nearest
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      const withDistance = rows.map((partner) => ({
        ...partner,
        distance: haversineDistance(userLat, userLng, partner.latitude, partner.longitude),
      }));

      // Sort by distance (nearest first) and round to 1 decimal
      withDistance.sort((a, b) => a.distance - b.distance);
      withDistance.forEach((p) => (p.distance = Math.round(p.distance * 10) / 10));

      return res.status(200).json({ success: true, massagers: withDistance });
    }

    // No GPS provided — return all partners without distance
    res.status(200).json({ success: true, massagers: rows });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Fetch partners error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get a single partner's profile/details
export const getPartnerById = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, "firstName", "lastName", email, phone, gender, latitude, longitude
       FROM "User"
       WHERE id = $1 AND role = 'partner'`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    res.status(200).json({ success: true, partner: rows[0] });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Fetch partner error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Partner updates their own profile
export const updatePartnerProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, gender } = req.body;
    const partnerId = req.user.id;

    const { rows } = await pool.query(
      `UPDATE "User"
       SET "firstName" = COALESCE($1, "firstName"),
           "lastName" = COALESCE($2, "lastName"),
           phone = COALESCE($3, phone),
           gender = COALESCE($4, gender)
       WHERE id = $5 AND role = 'partner'
       RETURNING id, "firstName", "lastName", email, phone, gender, role, latitude, longitude`,
      [firstName, lastName, phone, gender, partnerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    res.status(200).json({ success: true, message: "Profile updated successfully", user: rows[0] });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Update partner error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// [FIX 2026-03-29] Partner saves their GPS location
export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const partnerId = req.user.id;

    if (latitude == null || longitude == null) {
      return res.status(400).json({ success: false, message: "Latitude and longitude are required" });
    }

    await pool.query(
      `UPDATE "User" SET latitude = $1, longitude = $2 WHERE id = $3`,
      [latitude, longitude, partnerId]
    );

    res.status(200).json({ success: true, message: "Location updated successfully" });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Update location error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get the partner's current isActive status
export const getActiveStatus = async (req, res) => {
  try {
    const partnerId = req.user.id;
    const { rows } = await pool.query(
      `SELECT "isActive" FROM "User" WHERE id = $1 AND role = 'partner'`,
      [partnerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    res.status(200).json({ success: true, isActive: rows[0].isActive });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Get active status error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Toggle the partner's isActive status
export const toggleActiveStatus = async (req, res) => {
  try {
    const partnerId = req.user.id;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive must be a boolean" });
    }

    const { rows } = await pool.query(
      `UPDATE "User" SET "isActive" = $1 WHERE id = $2 AND role = 'partner' RETURNING "isActive"`,
      [isActive, partnerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    res.status(200).json({
      success: true,
      message: isActive ? "You are now Active — users can find you" : "You are now Inactive — hidden from search",
      isActive: rows[0].isActive,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Toggle active error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
