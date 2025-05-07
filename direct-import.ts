/**
 * This is a standalone script to directly import CSV files into the database
 * Run it with: npx tsx direct-import.ts path/to/file.csv
 */

import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './shared/schema';
import dotenv from 'dotenv';
import ws from 'ws';

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

// Load environment variables
dotenv.config();

// Check if file path was provided
const csvFilePath = process.argv[2];
if (!csvFilePath) {
  console.error('Please provide a path to the CSV file as an argument.');
  console.error('Example: npx tsx direct-import.ts ./attached_assets/1.csv');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(csvFilePath)) {
  console.error(`File not found: ${csvFilePath}`);
  process.exit(1);
}

// Configure batch size and retry settings
const BATCH_SIZE = 25;
const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // 3 seconds

async function importCoursesFromCSV() {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  // Create database connection with improved error handling
  const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000, // 10 seconds
    max: 20, // Maximum number of clients
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  };
  
  const pool = new Pool(poolConfig);
  
  // Add error handler to automatically handle disconnects
  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
  });
  
  const db = drizzle(pool, { schema });
  
  // Helper function to check database connection
  async function checkConnection() {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }
  
  // Helper function to create a delay
  function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  try {
    console.log(`\n=== Starting CSV Import ===`);
    console.log(`File: ${csvFilePath}\n`);
    
    // Read and parse the CSV file
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      cast: (value) => {
        // Convert empty strings to undefined
        if (value === '') return undefined;
        return value;
      }
    });

    console.log(`Found ${records.length} records in CSV file`);
    if (records.length === 0) {
      console.error("No records found in CSV file");
      process.exit(1);
    }

    // Show sample of the data
    console.log("\nSample column headers:", Object.keys(records[0]).join(', '));
    console.log("\nFirst record:", JSON.stringify(records[0], null, 2));
    
    // Determine if this is a university course CSV or online course CSV
    // Check for common fields in university courses
    const hasUniversityFields = records[0].hasOwnProperty('course_dept') || 
                               records[0].hasOwnProperty('university') ||
                               records[0].hasOwnProperty('course_number');
    
    const courseType = hasUniversityFields ? 'university' : 'online';
    console.log(`\nDetected course type: ${courseType}`);
    
    // Ask for confirmation
    console.log("\nStarting import process with these settings:");
    console.log(`- Course type: ${courseType}`);
    console.log(`- Batch size: ${BATCH_SIZE}`);
    console.log(`- Total records: ${records.length}`);
    console.log(`- Estimated batches: ${Math.ceil(records.length / BATCH_SIZE)}`);
    
    // Process records in batches
    const totalBatches = Math.ceil(records.length / BATCH_SIZE);
    let importedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    console.log(`\nProcessing ${records.length} records in ${totalBatches} batches...\n`);
    
    // Ensure database connection is active before starting
    const initialConnectionStatus = await checkConnection();
    if (!initialConnectionStatus) {
      console.error("Cannot connect to database. Please check your connection settings.");
      return;
    }
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, records.length);
      const batchRecords = records.slice(startIdx, endIdx);
      
      console.log(`[Batch ${batchIndex + 1}/${totalBatches}] Processing ${batchRecords.length} records...`);
      
      // Check connection at the start of each batch
      const connectionOk = await checkConnection();
      if (!connectionOk) {
        console.warn("Database connection issues detected, waiting before retrying...");
        
        // Wait a bit before continuing
        await delay(RETRY_DELAY);
        
        // Check connection again
        const reconnected = await checkConnection();
        if (!reconnected) {
          console.error("Could not reconnect to database, skipping batch");
          continue;
        }
        
        console.log("Successfully reconnected to database, continuing import");
      }
      
      // Process each course in the batch
      for (let j = 0; j < batchRecords.length; j++) {
        const record = batchRecords[j];
        const recordIndex = startIdx + j;
        
        // Implement retry logic for individual records
        let retryCount = 0;
        let success = false;
        
        while (!success && retryCount < MAX_RETRIES) {
          try {
            if (courseType === 'university') {
              // Extract university course data from CSV
              const courseTitle = record.course_title || record.title;
              const url = record.url;
              const department = record.course_dept || record.department || '';
              const courseNumber = record.course_number || record.code || 'N/A';
              const university = record.university || 'University';
              const description = record.description;
              const professors = record.professors || record.professor;
              const recentSemesters = record.recent_semesters || record.semester;
              const credits = record.credits;
              
              // Validate required fields
              if (!courseTitle) {
                console.error(`Row ${recordIndex + 2}: Missing required field (title)`);
                errorCount++;
                break; // Exit the retry loop
              }
              
              // Insert university course
              const [createdCourse] = await db.insert(schema.universityCourses).values({
                university,
                courseDept: department,
                courseNumber: courseNumber || 'N/A',
                courseTitle,
                description,
                professors,
                recentSemesters,
                credits
              }).returning();
              
              // If URL provided, insert university course link
              if (url && createdCourse && createdCourse.id) {
                await db.insert(schema.universityCourseLinks).values({
                  courseId: createdCourse.id,
                  url,
                  title: "Course Link",
                  description: "Main course link"
                });
              }
            } else {
              // Extract online course data from CSV
              const title = record.title || record.course_title;
              const url = record.url;
              const shortIntro = record.short_intro || record.description;
              const category = record.category;
              const subCategory = record.sub_category || record.subcategory;
              
              // Validate required fields
              if (!title || !url) {
                console.error(`Row ${recordIndex + 2}: Missing required fields (title or url)`);
                errorCount++;
                break; // Exit the retry loop
              }
              
              // Insert online course
              await db.insert(schema.courses).values({
                title,
                url,
                shortIntro,
                category,
                subCategory,
                courseType: record.course_type,
                language: record.language,
                subtitleLanguages: record.subtitle_languages,
                skills: record.skills,
                instructors: record.instructors || record.instructor,
                rating: record.rating ? parseFloat(record.rating.toString().replace('stars', '')) : undefined,
                numberOfViewers: record.number_of_viewers ? parseInt(record.number_of_viewers.toString().replace(/,/g, '').trim()) : undefined,
                duration: record.duration,
                site: record.site,
                imageUrl: record.image_url
              });
            }
            
            importedCount++;
            success = true; // Mark as successful
            
            // Show progress every 10 records
            if (importedCount % 10 === 0 || importedCount === records.length) {
              const percentage = Math.round((importedCount / records.length) * 100);
              console.log(`Progress: ${importedCount}/${records.length} (${percentage}%)`);
            }
          } catch (error) {
            retryCount++;
            
            if (retryCount < MAX_RETRIES) {
              console.warn(`Error on row ${recordIndex + 2}, retry attempt ${retryCount}/${MAX_RETRIES}: ${error instanceof Error ? error.message : String(error)}`);
              
              // Check connection and try to recover if needed
              const isConnected = await checkConnection();
              if (!isConnected) {
                console.warn(`Database connection lost during import, waiting ${RETRY_DELAY/1000} seconds before retrying...`);
                await delay(RETRY_DELAY);
              } else {
                // Small delay between retries even if connection is OK
                await delay(500);
              }
            } else {
              // All retries failed
              console.error(`Failed to import ${courseType} course at row ${recordIndex + 2} after ${MAX_RETRIES} attempts:`, error);
              errors.push(`Row ${recordIndex + 2}: ${error instanceof Error ? error.message : String(error)}`);
              errorCount++;
              success = true; // Stop retrying
            }
          }
        } // End of while retry loop
      }
      
      console.log(`[Batch ${batchIndex + 1}/${totalBatches}] Completed. Running total: ${importedCount} imported, ${errorCount} errors\n`);
      
      // Add a delay between batches to avoid overwhelming the database
      if (batchIndex < totalBatches - 1) {
        console.log(`Adding delay between batches to prevent database overload...`);
        await delay(2000); // 2 second delay between batches
      }
    }
    
    // Final summary
    console.log(`\n=== Import Summary ===`);
    console.log(`Total records processed: ${records.length}`);
    console.log(`Successfully imported: ${importedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log(`\nFirst 5 errors:`);
      errors.slice(0, 5).forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      
      if (errors.length > 5) {
        console.log(`...and ${errors.length - 5} more errors`);
      }
    }
    
    console.log(`\n=== Import Complete ===`);
  } catch (error) {
    console.error('Error in import process:', error);
  } finally {
    // Close the DB connection
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the import
importCoursesFromCSV().catch(console.error);