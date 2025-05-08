import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";

// Load env vars
dotenv.config();

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

// Get connection string
const connectionString = process.env.DATABASE_URL;
console.log(
  "Using connection string (first part):",
  connectionString.substring(0, 30) + "..."
);

async function testConnection() {
  // Create a new pool
  const pool = new Pool({ connectionString });

  try {
    console.log("Testing connection...");
    const result = await pool.query("SELECT NOW()");
    console.log("Connection successful:", result.rows[0]);
  } catch (error) {
    console.error("Connection error:", error);
  } finally {
    await pool.end();
  }
}

testConnection();
