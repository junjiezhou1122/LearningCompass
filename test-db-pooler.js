import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";

// Load env vars
dotenv.config();

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

// Add connection options
const connectionOptions = {
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000, // 30 seconds timeout
};

console.log("Using connection options with longer timeout");

async function testConnection() {
  // Create a new pool
  const pool = new Pool(connectionOptions);

  try {
    console.log("Testing connection...");
    const result = await pool.query("SELECT NOW()");
    console.log("Connection successful:", result.rows[0]);
  } catch (error) {
    console.error("Connection error type:", error.constructor.name);
    console.error("Connection error message:", error.message);
    console.error("Full error:", error);
  } finally {
    await pool.end();
  }
}

testConnection();
