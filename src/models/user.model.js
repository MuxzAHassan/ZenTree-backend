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
    RETURNING id, email, role
  `;

  const values = [
    firstName,
    lastName,
    gender,
    dateOfBirth,
    phone,
    email,
    role || 'user',
    password,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const findUserByEmail = async (email) => {
  const { rows } = await pool.query(`SELECT * FROM "User" WHERE email = $1`, [
    email,
  ]);
  return rows[0];
};
