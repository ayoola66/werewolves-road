import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "../shared/schema";
import fs from "fs";

const isProduction = process.env.NODE_ENV === "production";

// For Railway's PostgreSQL, we need to use direct connection parameters
const connectionString = process.env.DATABASE_URL;
console.log(`DATABASE_URL: ${connectionString}`);

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  // Additional settings for better connection handling
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Connection timeout
  application_name: "werewolveshx", // Identify our application in logs
});

// Add error handler for the pool
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export const db = drizzle(pool, { schema });

// Run migrations on startup (no-op if already up to date)
(async () => {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const migrationsFolder = path.join(__dirname, "..", "db", "migrations");

    console.log("Running migrations...");
    await migrate(db, { migrationsFolder });
    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Error running migrations:", error);
    // Don't exit on migration error, just log it
    console.log("Continuing despite migration error...");
  }
})();
