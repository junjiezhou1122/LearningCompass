import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get database URL from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("No DATABASE_URL environment variable set");
  process.exit(1);
}

console.log(
  "Database URL is configured:",
  databaseUrl.substring(0, 30) + "..."
);

// Create a SQL client
const sql = neon(databaseUrl);

// Export SQL client directly
export { sql };

// Create a Drizzle client
export const db = drizzle(sql);

// Export other database functions
export async function testConnection() {
  try {
    console.log("Testing database connection...");
    const result = await sql`SELECT NOW()`;
    console.log("Database connection successful");
    return result;
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
}
