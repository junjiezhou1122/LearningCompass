import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Always load environment variables from .env file
const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn("No .env file found, using environment variables if present");
  dotenv.config();
}

// Configure neon to use websockets
neonConfig.webSocketConstructor = ws;

// Check and validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
} else {
  console.log(
    `Database URL is configured: ${process.env.DATABASE_URL.substring(
      0,
      25
    )}...`
  );
}

// Create database connection
let pool: Pool;
let db: ReturnType<typeof drizzle>;

try {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });

  // Test the database connection
  console.log("Testing database connection...");
  pool
    .query("SELECT NOW()")
    .then(() => {
      console.log("Database connection successful");
    })
    .catch((err) => {
      console.error("Database connection test failed:", err);
    });
} catch (error) {
  console.error("Failed to initialize database connection:", error);
  throw error;
}

// Export the database connection objects
export { pool, db };
