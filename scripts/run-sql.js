import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

async function setupDatabase() {
  console.log("Starting database setup...");

  const setupPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const sqlFilePath = path.join(__dirname, "create-tables.sql");
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    console.log("Connecting to database to run setup SQL...");
    await setupPool.query(sql);
    console.log("Database setup successful! All tables created.");
  } catch (error) {
    console.error("Error during database setup:", error);
    process.exit(1);
  } finally {
    console.log("Closing setup connection pool.");
    await setupPool.end();
  }
}

setupDatabase();
