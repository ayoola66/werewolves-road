import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../server/db.ts";
import path from "path";
import { fileURLToPath } from "url";

async function runMigrations() {
  console.log("Starting database migration...");
  try {
    // Drop the drizzle schema if it exists to ensure a clean migration
    await db.query.execute(`DROP SCHEMA IF EXISTS drizzle CASCADE;`);
    console.log("Dropped existing drizzle schema (if any).");

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
