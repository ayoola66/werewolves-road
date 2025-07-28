import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { env } from "../server/env";

const sql = postgres(env.DATABASE_URL, {
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  try {
    console.log("Running migrations...");
    const db = drizzle(sql);
    await sql`CREATE SCHEMA IF NOT EXISTS public`;
    await sql`SET search_path TO public`; // Explicitly set search path
    await migrate(db, { migrationsFolder: "./db/migrations" });
    console.log("Migrations completed successfully!");
  } catch (err) {
    console.error("Failed to run migrations:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
