// [FIX 2026-03-29] NEW FILE — Database migration script (#18)
// Run with: npm run migrate
// This creates all required tables if they don't exist.

import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { require: true, rejectUnauthorized: false },
});

const migrate = async () => {
  const client = await pool.connect();

  try {
    console.log("🔄 Running migrations...\n");

    // [FIX 2026-03-29] Create User table with all required fields (#18)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        id SERIAL PRIMARY KEY,
        "firstName" VARCHAR(100) NOT NULL,
        "lastName" VARCHAR(100) NOT NULL,
        gender VARCHAR(20),
        "dateOfBirth" DATE,
        phone VARCHAR(20),
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'partner')),
        password VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ User table created (or already exists)");

    // [FIX 2026-03-29] Create Booking table for appointment management (#18)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Booking" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "massagerId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "serviceType" VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        time VARCHAR(10) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Booking table created (or already exists)");

    // [FIX 2026-03-29] Create indexes for common query patterns (#18)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_email ON "User" (email);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_role ON "User" (role);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_booking_userId ON "Booking" ("userId");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_booking_massagerId ON "Booking" ("massagerId");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_booking_status ON "Booking" (status);
    `);
    console.log("✅ Indexes created (or already exist)");

    console.log("\n🎉 All migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
