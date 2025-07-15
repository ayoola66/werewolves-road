import fs from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import { neon, neonConfig } from "@neondatabase/serverless";
import { config } from "dotenv";

config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Configure neon to not use SSL in development
if (process.env.NODE_ENV === "development") {
  neonConfig.useSecureWebSocket = false;
}

async function migrate() {
  // We can safely assert the type here since we check for undefined above
  const sql = neon(connectionString as string);
  const db = drizzle(sql);

  try {
    console.log("Running migrations...");
    const migrationsDir = path.join(__dirname, "migrations");
    
    // Ensure migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.log("No migrations directory found, creating one...");
      fs.mkdirSync(migrationsDir, { recursive: true });
      return;
    }

    const files = fs.readdirSync(migrationsDir).sort();

    if (files.length === 0) {
      console.log("No migration files found.");
      return;
    }

    for (const file of files) {
      if (!file.endsWith(".sql")) continue;
      console.log(`Running migration: ${file}`);
      try {
        const sqlContent = fs.readFileSync(path.join(migrationsDir, file), "utf8");
        await sql`${sqlContent}`;
        console.log(`Successfully ran migration: ${file}`);
      } catch (error) {
        console.error(`Error running migration ${file}:`, error);
        throw error;
      }
    }

    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  }
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
