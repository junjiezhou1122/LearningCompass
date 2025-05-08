import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Configure neon to use the ws package for WebSocket connections
neonConfig.webSocketConstructor = ws;

// Your Neon database connection string
const connectionString =
  "postgresql://neondb_owner:npg_S2QXLOZ3mFCq@ep-falling-frog-a1xumu9r-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

// Create a connection pool with better timeout and retry settings
const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 30000, // 30 seconds timeout for connection attempts
  idleTimeoutMillis: 60000, // 1 minute idle timeout to help with scale-to-zero
  max: 20, // Maximum 20 connections in the pool
  retryLimit: 3, // Retry 3 times when a connection fails
});

// Add a global error handler to the pool to prevent crashes
pool.on("error", (err) => {
  console.error("Unexpected error on idle client:", err);
  // Don't crash the application when a connection is lost
});

/**
 * Execute a database query with automatic reconnection
 * @param {string|object} query - The SQL query to execute
 * @param {Array} params - Query parameters (optional)
 * @returns {Promise<object>} Query result
 */
export async function executeQuery(query, params = []) {
  let retries = 3;
  let lastError;

  while (retries > 0) {
    try {
      // Get a client from the pool and execute the query
      const client = await pool.connect();
      try {
        const result = await client.query(query, params);
        return result;
      } finally {
        // Release the client back to the pool
        client.release();
      }
    } catch (error) {
      lastError = error;
      console.error(
        `Database query error (retries left: ${retries - 1}):`,
        error.message
      );

      // If the error is related to connection issues, wait before retrying
      if (
        error.message.includes("Connection terminated") ||
        error.message.includes("timeout") ||
        error.message.includes("connection error")
      ) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s before retry
      } else {
        // For other types of errors, don't retry
        break;
      }

      retries--;
    }
  }

  throw (
    lastError ||
    new Error("Failed to execute database query after multiple retries")
  );
}

/**
 * Close the connection pool
 */
export async function closePool() {
  await pool.end();
}

// Simple query function that returns rows directly
export async function query(text, params = []) {
  const result = await executeQuery(text, params);
  return result.rows;
}

export { pool };
