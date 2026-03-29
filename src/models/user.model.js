import pool from "../config/db.js";

export const createUser = async ({
  firstName,
  lastName,
  gender,
  dateOfBirth,
  phone,
  email,
  role,
  password,
}) => {
  const query = `
    INSERT INTO "User"
    ("firstName", "lastName", gender, "dateOfBirth", phone, email, role, password)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, email, role, "firstName", "lastName"
  `;

  const values = [
    firstName,
    lastName,
    gender,
    dateOfBirth,
    phone,
    email,
    role || "user",
    password,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

// [FIX 2026-03-29] Split into two queries: one for login (needs password hash),
// one for profile (no password). Previously used SELECT * which always returned password (#6)

export const findUserByEmailForLogin = async (email) => {
  // This query returns password hash — ONLY use for login/password comparison
  const { rows } = await pool.query(
    `SELECT id, "firstName", "lastName", email, phone, gender, "dateOfBirth", role, password FROM "User" WHERE email = $1`,
    [email]
  );
  return rows[0];
};

export const findUserByEmail = async (email) => {
  // [FIX 2026-03-29] Safe query — never returns password hash (#6)
  const { rows } = await pool.query(
    `SELECT id, "firstName", "lastName", email, phone, gender, "dateOfBirth", role FROM "User" WHERE email = $1`,
    [email]
  );
  return rows[0];
};

// [FIX 2026-03-29] Added getUserById for profile retrieval (#17)
export const getUserById = async (id) => {
  const { rows } = await pool.query(
    `SELECT id, "firstName", "lastName", email, phone, gender, "dateOfBirth", role FROM "User" WHERE id = $1`,
    [id]
  );
  return rows[0];
};
