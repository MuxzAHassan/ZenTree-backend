import pool from "../config/db.js";

export const createUser = async ({
  firstName,
  lastName,
  gender,
  dateOfBirth,
  phone,
  email,
  password,
}) => {
  const query = `
    INSERT INTO "User"
    ("firstName", "lastName", gender, "dateOfBirth", phone, email, password)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, email
  `;

  const values = [
    firstName,
    lastName,
    gender,
    dateOfBirth,
    phone,
    email,
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
