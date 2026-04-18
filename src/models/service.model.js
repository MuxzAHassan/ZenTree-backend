// [FIX 2026-03-29] NEW FILE — Service model: CRUD for partner services with prices
import pool from "../config/db.js";

// Create a new service for a partner
export const createService = async ({ partnerId, name, price, duration, description }) => {
  const query = `
    INSERT INTO "Service" ("partnerId", name, price, duration, description)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [partnerId, name, price, duration || 60, description || null]);
  return rows[0];
};

// Get all active services for a specific partner
export const getServicesByPartnerId = async (partnerId) => {
  const { rows } = await pool.query(
    `SELECT * FROM "Service" WHERE "partnerId" = $1 AND "isActive" = true ORDER BY name ASC`,
    [partnerId]
  );
  return rows;
};

// Get a single service by ID
export const getServiceById = async (id) => {
  const { rows } = await pool.query(`SELECT * FROM "Service" WHERE id = $1`, [id]);
  return rows[0];
};

// Update a service
export const updateService = async (id, { name, price, duration, description, isActive }) => {
  const { rows } = await pool.query(
    `UPDATE "Service"
     SET name = COALESCE($1, name),
         price = COALESCE($2, price),
         duration = COALESCE($3, duration),
         description = COALESCE($4, description),
         "isActive" = COALESCE($5, "isActive")
     WHERE id = $6
     RETURNING *`,
    [name, price, duration, description, isActive, id]
  );
  return rows[0];
};

// Delete a service (soft delete by setting isActive = false)
export const deleteService = async (id) => {
  const { rows } = await pool.query(
    `UPDATE "Service" SET "isActive" = false WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0];
};
