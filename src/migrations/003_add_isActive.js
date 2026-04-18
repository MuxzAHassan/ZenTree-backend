// Migration 003: Add isActive column to User table for partner availability toggle
import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
const { Pool } = pg;

const isRemoteDB = (process.env.DATABASE_URL || "").includes("render.com");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isRemoteDB && { ssl: { require: true, rejectUnauthorized: false } }),
});

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log("🔄 Running migration 003...\n");

    // Add isActive column — defaults to false (partners must manually activate)
    await client.query(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT false;`
    );
    console.log('✅ User table: added "isActive" column (default: false)');

    // Create index for faster filtering on isActive
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_user_isActive ON "User" ("isActive");`
    );
    console.log("✅ Index created on isActive");

    console.log("\n🎉 Migration 003 completed successfully!");
  } catch (error) {
    console.error("❌ Migration 003 failed:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
