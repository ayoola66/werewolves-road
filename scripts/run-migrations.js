import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../server/db.ts";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";

async function runMigrations() {
  console.log("Starting database migration...");

  // Create a temporary, direct connection to drop the schema
  const tempPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("Connecting directly to drop drizzle schema...");
    await tempPool.query(`DROP SCHEMA IF EXISTS drizzle CASCADE;`);
    console.log("Dropped existing drizzle schema (if any).");
    await tempPool.end();
    console.log("Direct connection closed.");

    console.log("Proceeding with standard migration...");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const migrationsFolder = path.join(__dirname, "..", "db", "migrations");

    await migrate(db, { migrationsFolder });
    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
