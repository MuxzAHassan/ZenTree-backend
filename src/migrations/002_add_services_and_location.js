// [FIX 2026-03-29] NEW FILE — Migration: Service table, location/pushToken on User, serviceId on Booking
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
    console.log("🔄 Running migration 002...\n");

    // Add location and pushToken columns to User table
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;`);
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;`);
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pushToken" VARCHAR(255);`);
    console.log("✅ User table: added latitude, longitude, pushToken columns");

    // Create Service table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Service" (
        id SERIAL PRIMARY KEY,
        "partnerId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        duration INTEGER NOT NULL DEFAULT 60,
        description TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Service table created");

    // Add serviceId to Booking table
    await client.query(`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "serviceId" INTEGER REFERENCES "Service"(id);`);
    console.log("✅ Booking table: added serviceId column");

    // Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_service_partnerId ON "Service" ("partnerId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_booking_serviceId ON "Booking" ("serviceId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_location ON "User" (latitude, longitude);`);
    console.log("✅ Indexes created");

    console.log("\n🎉 Migration 002 completed successfully!");
  } catch (error) {
    console.error("❌ Migration 002 failed:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
