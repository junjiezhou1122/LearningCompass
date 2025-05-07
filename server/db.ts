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

// Create database connection with connection management
let pool: Pool;
let db: ReturnType<typeof drizzle>;

// Connection options with retry logic
const connectionOptions = {
  connectionString: process.env.DATABASE_URL,
  // Add connection timeouts and limits
  connectionTimeoutMillis: 10000, // 10 seconds
  max: 20, // Maximum number of clients
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
};

try {
  pool = new Pool(connectionOptions);
  
  // Add error handler to automatically handle disconnects
  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
    // Don't throw from event handler to avoid crashing the server
  });
  
  // Create drizzle ORM instance
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

// Helper function to check connection and potentially reconnect
export async function ensureConnection(): Promise<boolean> {
  try {
    // Test the connection with a lightweight query
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection error, attempting to reconnect:', error);
    
    try {
      // Close existing connections
      await pool.end();
      
      // Create a new pool
      pool = new Pool(connectionOptions);
      db = drizzle(pool, { schema });
      
      // Test the new connection
      await pool.query('SELECT 1');
      console.log('Successfully reconnected to database');
      return true;
    } catch (reconnectError) {
      console.error('Failed to reconnect to database:', reconnectError);
      return false;
    }
  }
}

// Export the database connection objects
export { pool, db };
