// [FIX 2026-03-29] Restored dotenv.config() here — ES module imports are hoisted,
// so db.js executes BEFORE dotenv.config() in server.js. Without this,
// DATABASE_URL would be undefined when the Pool is created.
import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
const { Pool } = pg;

// [FIX 2026-03-29] Make SSL conditional — local PostgreSQL doesn't support SSL,
// but Render (remote) databases require it. Detects by checking if the URL
// points to a remote host like render.com
const isRemoteDB = (process.env.DATABASE_URL || "").includes("render.com");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Only enable SSL for remote databases (e.g., Render)
  ...(isRemoteDB && { ssl: { require: true, rejectUnauthorized: false } }),
});

export default pool;
