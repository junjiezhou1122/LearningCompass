import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

// Use connection string directly
const connectionString =
  "postgresql://neondb_owner:npg_S2QXLOZ3mFCq@ep-falling-frog-a1xumu9r-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function testConnection() {
  // Configure connection options
  const connectionOptions = {
    connectionString,
    connectionTimeoutMillis: 30000, // 30 seconds timeout
  };

  console.log(
    "Using connection string (first part):",
    connectionString.substring(0, 30) + "..."
  );
  console.log("Testing connection...");

  // Create a new pool
  const pool = new Pool(connectionOptions);

  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Connection successful:", result.rows[0]);
  } catch (error) {
    console.error("Connection error:", error);
  } finally {
    await pool.end();
  }
}

// Run the test
testConnection();
