import dotenv from "dotenv";
dotenv.config();

import pool from "./src/config/db.js";
import app from "./src/app.js";

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "localhost";
const SERVER_URL = `http://${HOST}:${PORT}`;

(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL connected successfully");
    client.release();
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
  }
})();

app.listen(PORT, () => {
  console.log("Server is running:");
  console.log(SERVER_URL);
  console.log(`Swagger Docs: ${SERVER_URL}/api/docs`);
});
