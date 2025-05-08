#!/usr/bin/env node

/**
 * This script tests importing university courses from a CSV file
 * with the corrected schema that does not include a created_by field.
 */

import fs from "fs";
import path from "path";
import pg from "pg";
import { parse } from "csv-parse/sync";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Set up dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Get database connection string from environment
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is required.");
  process.exit(1);
}

// Configuration
const CSV_FILE = path.resolve(__dirname, "./attached_assets/1.csv");
const BATCH_SIZE = 20;

// Destructure Pool from pg
const { Pool } = pg;

async function testImport() {
  console.log("\n=== Testing University Courses CSV Import ===\n");

  // Create a database connection pool
  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 5,
  });

  let client;

  try {
    console.log("Connecting to database...");
    // Get a database client from the pool
    client = await pool.connect();
    console.log("Successfully connected to database.");

    // Read and parse CSV file
    console.log(`\nReading CSV file: ${CSV_FILE}`);
    if (!fs.existsSync(CSV_FILE)) {
      console.error(`ERROR: CSV file not found: ${CSV_FILE}`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(CSV_FILE, { encoding: "utf-8" });
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`\nFound ${records.length} records in CSV file.`);
    console.log(`First record:`, records[0]);

    // Process records
    console.log("\nStarting import process...");
    let importedCount = 0;
    let failedCount = 0;

    // Begin transaction
    await client.query("BEGIN");

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      // Extract data from CSV record
      const university = record.university || "Unknown University";
      const courseDept = record.course_dept || "General";
      const courseNumber = record.course_number || "";
      const courseTitle = record.course_title || "Untitled Course";
      const description = record.description || "";
      const professors = record.professors || "";
      const recentSemesters = record.recent_semesters || "";
      const credits = record.credits || null;
      const url = record.url || null;
      const createdAt = new Date().toISOString();

      try {
        console.log(
          `\nProcessing record #${
            i + 1
          }: ${university} ${courseDept} ${courseNumber} - ${courseTitle}`
        );

        // Insert university course using the corrected SQL without created_by
        const insertQuery = `
          INSERT INTO university_courses 
          (university, course_dept, course_number, course_title, description, professors, recent_semesters, credits, created_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
          RETURNING id`;

        const insertParams = [
          university,
          courseDept,
          courseNumber,
          courseTitle,
          description,
          professors,
          recentSemesters,
          credits,
          createdAt,
        ];

        console.log(`SQL parameters:`, insertParams);

        const result = await client.query(insertQuery, insertParams);
        const courseId = result.rows[0]?.id;

        if (courseId && url) {
          // Insert the course link if URL is available
          await client.query(
            `INSERT INTO university_course_links 
            (course_id, url, title, description, created_at) 
            VALUES ($1, $2, $3, $4, $5)`,
            [courseId, url, "Course Link", "Imported from CSV", createdAt]
          );
        }

        importedCount++;
        console.log(`Successfully imported record #${i + 1}`);

        // Commit every BATCH_SIZE records
        if (importedCount % BATCH_SIZE === 0) {
          await client.query("COMMIT");
          await client.query("BEGIN");
          console.log(
            `\nCommitted batch of ${BATCH_SIZE} records. Progress: ${importedCount}/${records.length}`
          );
        }
      } catch (error) {
        failedCount++;
        console.error(`ERROR importing record #${i + 1}:`, error.message);
      }
    }

    // Commit final batch
    await client.query("COMMIT");

    console.log("\n=== Import Results ===");
    console.log(`Total records: ${records.length}`);
    console.log(`Successfully imported: ${importedCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log(
      `Success rate: ${Math.round((importedCount / records.length) * 100)}%`
    );

    if (importedCount > 0) {
      console.log("\nVERIFICATION: Querying imported courses...");
      const verifyResult = await client.query(
        "SELECT COUNT(*) FROM university_courses"
      );
      console.log(
        `Total university courses in database: ${verifyResult.rows[0].count}`
      );
    }
  } catch (error) {
    console.error("\nERROR during import process:", error);
    // Try to rollback if there's an error
    if (client) {
      try {
        await client.query("ROLLBACK");
        console.log("Transaction rolled back due to error");
      } catch (rollbackError) {
        console.error("ERROR during rollback:", rollbackError);
      }
    }
  } finally {
    // Release client back to the pool
    if (client) {
      client.release();
      console.log("\nDatabase client released.");
    }

    // Close the pool
    await pool.end();
    console.log("Database connection pool closed.");
    console.log("\n=== Test Complete ===\n");
  }
}

// Run the test
testImport().catch(console.error);
