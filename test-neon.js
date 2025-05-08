import { query, closePool } from "./neon-db.js";

async function testConnection() {
  try {
    console.log("Testing database connection...");
    const result = await query("SELECT NOW() as time");
    console.log("Connection successful!");
    console.log("Current time from database:", result[0].time);

    // Try a query that might be longer
    console.log("\nTesting a more complex query...");
    const version = await query("SELECT version()");
    console.log("Database version:", version[0].version);

    // Make sure we always close the pool
    await closePool();
    console.log("Connection pool closed.");
  } catch (error) {
    console.error("Error connecting to Neon database:", error);
    process.exit(1);
  }
}

testConnection();
