const express = require("express");
const { db } = require("./db.ts");
const { universityCourses } = require("../shared/schema.ts");
const { eq, and, sql } = require("drizzle-orm");

const router = express.Router();

// Simple GET endpoint to test if the university courses API is working
router.get("/university-courses/test", async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "University courses API is working",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Database connection test endpoint
router.get("/university-courses/db-test", async (req, res) => {
  try {
    // Simple test query
    const testResult = await db.execute(sql`SELECT 1 as test`);
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    return res.status(200).json({
      success: true,
      message: "Database connection is working",
      test: testResult,
      tables: tables.map((t) => t.table_name),
    });
  } catch (error) {
    console.error("Database connection test failed:", error);
    return res.status(500).json({
      success: false,
      message: "Database connection test failed",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Route to remove duplicate university courses
// DELETE /api/university-courses/duplicates
router.delete("/university-courses/duplicates", async (req, res) => {
  try {
    console.log("Starting duplicate course removal process");

    // First, check if the university_courses table exists and is accessible
    try {
      const tableCheck = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'university_courses'
          );
        `);

      if (!tableCheck || tableCheck.length === 0 || !tableCheck[0].exists) {
        console.error(
          "university_courses table does not exist or is not accessible"
        );
        return res.status(404).json({
          success: false,
          message: "university_courses table not found",
        });
      }

      console.log("✓ Confirmed university_courses table exists");
    } catch (tableCheckError) {
      console.error(
        "Error checking university_courses table:",
        tableCheckError
      );
      return res.status(500).json({
        success: false,
        message: "Failed to verify university_courses table",
        error: tableCheckError.message,
      });
    }

    // Check if related tables exist to handle foreign keys
    const relatedTables = [
      "university_course_bookmarks",
      "university_course_comments",
      "university_course_resources",
      "university_course_collaborations",
      "university_course_links",
    ];

    const tableStatus = {};

    for (const table of relatedTables) {
      try {
        const tableCheck = await db.execute(sql`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = ${table}
            );
          `);

        const exists =
          tableCheck && tableCheck.length > 0 && tableCheck[0].exists;
        tableStatus[table] = exists;
        console.log(`Table ${table}: ${exists ? "exists" : "does not exist"}`);
      } catch (err) {
        console.error(`Error checking ${table} table:`, err.message);
        tableStatus[table] = false;
      }
    }

    // Use a direct SQL query to find and remove duplicates
    try {
      const result = await db.execute(sql`
          WITH duplicates AS (
            SELECT id, university, course_dept, course_number,
              ROW_NUMBER() OVER (
                PARTITION BY university, course_dept, course_number
                ORDER BY id
              ) as row_num
            FROM university_courses
          )
          DELETE FROM university_courses
          WHERE id IN (
            SELECT id FROM duplicates
            WHERE row_num > 1
          )
          RETURNING id;
        `);

      const removedCount = result.length || 0;
      console.log(`Directly removed ${removedCount} duplicate courses`);

      return res.status(200).json({
        success: true,
        message: `Successfully removed ${removedCount} duplicate courses.`,
        removedCount,
        tableStatus,
      });
    } catch (sqlError) {
      console.error("SQL error removing duplicates:", sqlError);
      return res.status(500).json({
        success: false,
        message: "SQL error during duplicate removal",
        error: sqlError.message,
        tableStatus,
      });
    }
  } catch (error) {
    console.error(
      "Error removing duplicate university courses:",
      error.message
    );
    console.error(error.stack);
    return res.status(500).json({
      success: false,
      message: "Failed to remove duplicate courses",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

module.exports = router;
