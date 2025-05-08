import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import fs from "fs";
import { parse } from "csv-parse/sync";

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

// Use the same connection string as in neon-db.js
const connectionString =
  "postgresql://neondb_owner:npg_S2QXLOZ3mFCq@ep-falling-frog-a1xumu9r-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

if (!connectionString) {
  console.error("Connection string is not available");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function importCoursesFromCSV() {
  try {
    // Read the CSV file
    const csvData = fs.readFileSync("./test_university_courses.csv", "utf8");

    // Parse the CSV data
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`Found ${records.length} courses to import`);

    // Connect to the database
    const client = await pool.connect();
    try {
      // Insert each course into the database
      for (const record of records) {
        const {
          "Course Title": courseTitle,
          Department: courseDept,
          "Course Code": courseNumber,
          Credits: credits,
          Professor: professors,
        } = record;

        // Insert the course into the database
        const query = `
          INSERT INTO university_courses (
            university, 
            course_dept, 
            course_number, 
            course_title, 
            description, 
            professors, 
            credits
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `;

        const values = [
          "Example University", // Replace with actual university name if available in CSV
          courseDept,
          courseNumber,
          courseTitle,
          "", // No description in the CSV
          professors,
          credits,
        ];

        const result = await client.query(query, values);
        console.log(
          `Imported course: ${courseTitle} (ID: ${result.rows[0].id})`
        );
      }

      console.log("University courses import complete!");
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error importing courses:", error);
  } finally {
    await pool.end();
  }
}

// Run the import function
importCoursesFromCSV();
