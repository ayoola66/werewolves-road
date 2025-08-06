import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import * as schema from "../shared/schema.ts";

async function runMigrations() {
  console.log("Starting self-contained database migration...");

  const migrationPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    idleTimeoutMillis: 1000,
  });

  const db = drizzle(migrationPool, { schema });

  try {
    console.log("Attempting to drop drizzle schema (if it exists)...");
    await migrationPool.query(`DROP SCHEMA IF EXISTS drizzle CASCADE;`);
    console.log("Dropped existing drizzle schema.");

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const migrationsFolder = path.join(__dirname, "..", "db", "migrations");

    // --- DIAGNOSTIC LOGGING ---
    console.log(`Looking for migrations in: ${migrationsFolder}`);
    const migrationFiles = fs.readdirSync(migrationsFolder);
    console.log("Found migration files:", migrationFiles);
    // -------------------------

    console.log("Running migrations with self-contained connection...");
    await migrate(db, { migrationsFolder });
    console.log(
      "Migrations completed successfully! Tables should now be created."
    );
  } catch (error) {
    console.error("Error during self-contained migration:", error);
    process.exit(1);
  } finally {
    console.log("Closing migration connection pool.");
    await migrationPool.end();
  }
}

runMigrations();
