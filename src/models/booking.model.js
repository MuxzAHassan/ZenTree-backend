// [FIX 2026-03-29] Booking model updated with serviceId + service info in queries
import pool from "../config/db.js";

// Create a new booking (now includes serviceId)
export const createBooking = async ({ userId, massagerId, serviceId, serviceType, date, time }) => {
  const query = `
    INSERT INTO "Booking"
    ("userId", "massagerId", "serviceId", "serviceType", date, time, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'pending')
    RETURNING *
  `;
  const values = [userId, massagerId, serviceId, serviceType, date, time];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Get all bookings for a user (with partner name + service info)
export const getBookingsByUserId = async (userId) => {
  const { rows } = await pool.query(
    `SELECT b.*, 
            u."firstName" AS "massagerName", u."lastName" AS "massagerLastName",
            s.name AS "serviceName", s.price AS "servicePrice", s.duration AS "serviceDuration"
     FROM "Booking" b
     LEFT JOIN "User" u ON b."massagerId" = u.id
     LEFT JOIN "Service" s ON b."serviceId" = s.id
     WHERE b."userId" = $1
     ORDER BY b.date DESC, b.time DESC`,
    [userId]
  );
  return rows;
};

// Get all bookings for a partner (with user name + contact)
export const getBookingsByMassagerId = async (massagerId) => {
  const { rows } = await pool.query(
    `SELECT b.*,
            u."firstName" AS "userName", u."lastName" AS "userLastName", u.phone AS "userPhone",
            s.name AS "serviceName", s.price AS "servicePrice", s.duration AS "serviceDuration"
     FROM "Booking" b
     LEFT JOIN "User" u ON b."userId" = u.id
     LEFT JOIN "Service" s ON b."serviceId" = s.id
     WHERE b."massagerId" = $1
     ORDER BY b.date DESC, b.time DESC`,
    [massagerId]
  );
  return rows;
};

// Get a single booking by ID
export const getBookingById = async (id) => {
  const { rows } = await pool.query(
    `SELECT b.*, 
            s.name AS "serviceName", s.price AS "servicePrice"
     FROM "Booking" b
     LEFT JOIN "Service" s ON b."serviceId" = s.id
     WHERE b.id = $1`,
    [id]
  );
  return rows[0];
};

// Update booking status
export const updateBookingStatus = async (id, status) => {
  const { rows } = await pool.query(
    `UPDATE "Booking" SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0];
};
