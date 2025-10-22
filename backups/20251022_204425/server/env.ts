import * as dotenv from "dotenv";

dotenv.config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || "",
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || "8080",
  HOST: process.env.HOST || "0.0.0.0",
  SENTRY_DSN: process.env.SENTRY_DSN || "",
  // Railway-specific environment variables
  RAILWAY_STATIC_URL: process.env.RAILWAY_STATIC_URL || "",
  RAILWAY_PUBLIC_DOMAIN: process.env.RAILWAY_PUBLIC_DOMAIN || "",
};
