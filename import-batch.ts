import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import * as dotenv from 'dotenv';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './shared/schema';

// Configure environment
dotenv.config();

async function importCourses() {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set");
    return;
  }

  // Create database connection
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    console.log('Starting batch CSV import test...');
    
    // Path to the CSV file
    const csvFilePath = path.join(process.cwd(), 'attached_assets', '1.csv');
    console.log(`Reading CSV file: ${csvFilePath}`);
    
    // Check if file exists
    if (!fs.existsSync(csvFilePath)) {
      console.error(`CSV file not found at ${csvFilePath}`);
      return;
    }
    
    // Read and parse the CSV file
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      cast: (value) => {
        // Convert empty strings to undefined for non-required fields
        if (value === '') return undefined;
        return value;
      }
    });
    
    console.log(`Found ${records.length} courses in CSV file ready for import`);
    
    // Process records in batches for better performance
    const BATCH_SIZE = 25;
    const totalBatches = Math.ceil(records.length / BATCH_SIZE);
    let importedCount = 0;
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, records.length);
      const batchRecords = records.slice(startIdx, endIdx);
      console.log(`Processing batch ${batchIndex + 1} of ${totalBatches} (${batchRecords.length} records)`);
      
      // Process each batch
      for (let j = 0; j < batchRecords.length; j++) {
        const record = batchRecords[j];
        
        try {
          // Extract university course data from CSV
          const courseTitle = record.course_title;
          const url = record.url;
          const department = record.course_dept || '';
          const courseNumber = record.course_number || 'N/A';
          const university = record.university || 'University';
          const description = record.description;
          const professors = record.professors;
          const recentSemesters = record.recent_semesters;
          const credits = record.credits;
          
          // Validate required fields
          if (!courseTitle) {
            console.error(`Row ${startIdx + j + 2}: Missing required field (title)`);
            continue;
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
          
          importedCount++;
        } catch (error) {
          console.error(`Error importing university course at row ${startIdx + j + 2}:`, error);
        }
      }
      
      console.log(`Successfully processed batch ${batchIndex + 1}, imported ${batchRecords.length} courses`);
    }
    
    console.log(`Import completed. Successfully imported ${importedCount} out of ${records.length} courses.`);
  } catch (error) {
    console.error('Error in batch import:', error);
  } finally {
    // Close the DB connection
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the import
importCourses().catch(console.error);