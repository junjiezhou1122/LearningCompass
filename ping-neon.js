import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

// Use the direct endpoint instead of the pooler endpoint
const connectionString =
  "postgresql://neondb_owner:npg_S2QXLOZ3mFCq@ep-falling-frog-a1xumu9r.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function pingNeon() {
  console.log("Pinging Neon database (non-pooler endpoint)...");

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 30000, // 30 seconds timeout
  });

  try {
    const result = await pool.query("SELECT 1");
    console.log("Connection successful:", result.rows[0]);
  } catch (error) {
    console.error("Connection error:", error);
  } finally {
    await pool.end();
  }
}

pingNeon();
