import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import "dotenv/config";

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

// Use the same connection string as in neon-db.js
const connectionString =
  "postgresql://neondb_owner:npg_S2QXLOZ3mFCq@ep-falling-frog-a1xumu9r-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

// Also try environment variable as fallback
if (!connectionString) {
  console.error("Connection string is not available");
  process.exit(1);
}

const pool = new Pool({ connectionString });

// Tables to check and create if missing
const tablesToCheck = [
  {
    name: "university_courses",
    createSql: `
      CREATE TABLE university_courses (
        id SERIAL PRIMARY KEY,
        university TEXT NOT NULL,
        course_dept TEXT NOT NULL,
        course_number TEXT NOT NULL,
        course_title TEXT NOT NULL,
        description TEXT,
        professors TEXT,
        recent_semesters TEXT,
        credits TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP
      );
    `,
  },
];

async function checkAndCreateTables() {
  const client = await pool.connect();
  try {
    for (const table of tablesToCheck) {
      // Check if the table exists
      const checkTableResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table.name}'
        );
      `);

      const tableExists = checkTableResult.rows[0].exists;

      if (!tableExists) {
        console.log(`${table.name} table doesn't exist. Creating it now...`);

        try {
          // Create the table
          await client.query(table.createSql);
          console.log(`${table.name} table created successfully`);
        } catch (error) {
          console.error(`Error creating ${table.name} table:`, error);
        }
      } else {
        console.log(`${table.name} table already exists`);
      }
    }
    console.log("Basic university courses table setup complete!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAndCreateTables();
