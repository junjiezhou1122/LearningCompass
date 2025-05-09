import dotenv from "dotenv";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Initialize dotenv
dotenv.config();

const { Pool } = pg;

// Create a database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function removeDuplicateCourses() {
  const client = await pool.connect();

  try {
    console.log("Starting duplicate removal process...");

    // Check if the university_courses table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'university_courses'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.error("Error: university_courses table does not exist");
      return;
    }

    console.log("✓ Confirmed university_courses table exists");

    // Check which related tables exist
    const relatedTables = [
      "university_course_bookmarks",
      "university_course_comments",
      "university_course_resources",
      "university_course_collaborations",
      "university_course_links",
    ];

    const existingTables = [];

    for (const table of relatedTables) {
      const tableExists = await client.query(
        `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `,
        [table]
      );

      if (tableExists.rows[0].exists) {
        existingTables.push(table);
        console.log(`✓ Found related table: ${table}`);
      }
    }

    // First, identify duplicate courses
    const duplicatesQuery = await client.query(`
      SELECT university, course_dept, course_number, 
             ARRAY_AGG(id ORDER BY id) as duplicate_ids,
             COUNT(*) as count
      FROM university_courses
      GROUP BY university, course_dept, course_number
      HAVING COUNT(*) > 1
      ORDER BY count DESC;
    `);

    if (duplicatesQuery.rows.length === 0) {
      console.log("No duplicate courses found.");
      return;
    }

    console.log(
      `Found ${duplicatesQuery.rows.length} groups of duplicate courses:`
    );
    duplicatesQuery.rows.forEach((row) => {
      console.log(
        `- ${row.university} ${row.course_dept} ${row.course_number}: ${row.count} duplicates`
      );
      console.log(`  IDs: ${row.duplicate_ids.join(", ")}`);
    });

    // Begin transaction
    await client.query("BEGIN");

    let totalRemoved = 0;

    try {
      // Process each group of duplicates
      for (const duplicate of duplicatesQuery.rows) {
        const duplicateIds = duplicate.duplicate_ids;
        const originalId = duplicateIds[0]; // Keep the oldest entry
        const idsToRemove = duplicateIds.slice(1); // Remove the rest

        console.log(
          `\nProcessing group: ${duplicate.university} ${duplicate.course_dept} ${duplicate.course_number}`
        );
        console.log(
          `Keeping ID: ${originalId}, Removing IDs: ${idsToRemove.join(", ")}`
        );

        // Handle foreign key relationships for each table
        for (const table of existingTables) {
          let foreignKeyColumn;

          // Determine the correct foreign key column name based on the table
          if (table === "university_course_bookmarks") {
            foreignKeyColumn = "university_course_id";
          } else {
            foreignKeyColumn = "course_id";
          }

          // For bookmarks, we need to handle potential unique constraint violations
          if (table === "university_course_bookmarks") {
            // Update bookmarks that don't create duplicates
            await client.query(
              `
              UPDATE ${table}
              SET ${foreignKeyColumn} = $1
              WHERE ${foreignKeyColumn} = ANY($2)
              AND NOT EXISTS (
                SELECT 1 FROM ${table} 
                WHERE ${foreignKeyColumn} = $1 
                AND user_id = ${table}.user_id
              )
            `,
              [originalId, idsToRemove]
            );

            // Delete bookmarks that would violate unique constraints
            await client.query(
              `
              DELETE FROM ${table}
              WHERE ${foreignKeyColumn} = ANY($1)
            `,
              [idsToRemove]
            );
          } else {
            // For other tables, simply update the foreign key to point to the original
            await client.query(
              `
              UPDATE ${table}
              SET ${foreignKeyColumn} = $1
              WHERE ${foreignKeyColumn} = ANY($2)
            `,
              [originalId, idsToRemove]
            );
          }

          console.log(`✓ Updated references in ${table}`);
        }

        // Now delete the duplicate courses
        const deleteResult = await client.query(
          `
          DELETE FROM university_courses
          WHERE id = ANY($1)
          RETURNING id
        `,
          [idsToRemove]
        );

        totalRemoved += deleteResult.rowCount;
        console.log(
          `✓ Removed ${deleteResult.rowCount} duplicates from this group`
        );
      }

      // Commit the transaction
      await client.query("COMMIT");
      console.log(`\nTransaction completed successfully.`);
      console.log(`Total duplicate courses removed: ${totalRemoved}`);
    } catch (error) {
      // Rollback the transaction in case of error
      await client.query("ROLLBACK");
      console.error("Error during transaction, changes rolled back:", error);
    }
  } catch (error) {
    console.error("Error removing duplicates:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
removeDuplicateCourses().catch(console.error);
