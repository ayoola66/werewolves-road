import path from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../shared/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const queryClient = postgres(connectionString, {
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
  application_name: "werewolveshx",
});

export const db = drizzle(queryClient, { schema });
