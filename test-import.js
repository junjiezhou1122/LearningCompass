import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.URL || import.meta.url);
const { parse } = require('csv-parse/sync');

// Import as ESM modules
import { db } from './server/db.js';
import { storage } from './server/storage.js';

async function testImportCsv() {
  try {
    console.log('Starting CSV import test...');
    
    // Path to the CSV file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const csvFilePath = path.join(__dirname, 'attached_assets', '1.csv');
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
    
    // Column mapping for university courses
    const columnMapping = {
      title: 'course_title',
      url: 'url',
      shortIntro: 'description',
      department: 'course_dept',
      courseCode: 'course_number',
      professor: 'professors',
      semester: 'recent_semesters',
      credits: 'credits'
    };
    
    // Process records in batches for better performance
    const BATCH_SIZE = 25; // Process 25 records at a time
    const totalBatches = Math.ceil(records.length / BATCH_SIZE);
    let importedCount = 0;
    const errors = [];
    
    console.log(`Processing ${totalBatches} batches of size ${BATCH_SIZE}`);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, records.length);
      const batchRecords = records.slice(startIdx, endIdx);
      console.log(`Processing batch ${batchIndex + 1} of ${totalBatches} (${batchRecords.length} records)`);
      
      // Process each batch with a database transaction
      try {
        // Prepare all the university course data for this batch
        const batchCourseData = [];
        
        // Pre-process the batch to validate and prepare data
        for (let j = 0; j < batchRecords.length; j++) {
          const record = batchRecords[j];
          const recordIndex = startIdx + j;
          
          try {
            // For required fields, use the columnMapping to locate them in the record
            const courseTitle = record[columnMapping.title];
            
            // Use URL field for course link 
            const url = record[columnMapping.url];
            
            // Validate required fields
            if (!courseTitle) {
              errors.push(`Row ${recordIndex + 2}: Missing required field (title)`);
              continue;
            }
            
            // Map department and course code fields
            const department = columnMapping.department ? record[columnMapping.department] : '';
            const courseNumber = columnMapping.courseCode ? record[columnMapping.courseCode] : '';
            
            // Determine university from a field or use a default value
            const university = record.university || "University";
            
            // Create university course data with mappings from the CSV
            const universityCourseData = {
              university: university,
              courseDept: department,
              courseNumber: courseNumber || 'N/A',
              courseTitle: courseTitle,
              description: columnMapping.shortIntro ? record[columnMapping.shortIntro] : undefined,
              professors: columnMapping.professor ? record[columnMapping.professor] : undefined,
              recentSemesters: columnMapping.semester ? record[columnMapping.semester] : undefined,
              credits: columnMapping.credits ? record[columnMapping.credits] : undefined
            };
            
            // Add to batch data with URL for later processing
            batchCourseData.push({
              course: universityCourseData,
              url: url,
              index: recordIndex
            });
          } catch (error) {
            console.error(`Error preparing university course at row ${recordIndex + 2}:`, error);
            errors.push(`Row ${recordIndex + 2}: ${error.message || String(error)}`);
          }
        }
        
        // Now process the batch with the database
        for (const courseData of batchCourseData) {
          try {
            // Store university course in database
            const createdCourse = await storage.createUniversityCourse(courseData.course);
            
            // If a URL was provided, also create a link for the course
            if (courseData.url && createdCourse && createdCourse.id) {
              await storage.createUniversityCourseLink({
                courseId: createdCourse.id,
                url: courseData.url,
                title: "Course Link",
                description: "Main course link"
              });
            }
            
            importedCount++;
          } catch (error) {
            console.error(`Error importing university course at row ${courseData.index + 2}:`, error);
            errors.push(`Row ${courseData.index + 2}: ${error.message || String(error)}`);
          }
        }
        
        console.log(`Successfully processed batch ${batchIndex + 1}, imported ${batchCourseData.length} courses`);
      } catch (batchError) {
        console.error(`Error processing batch ${batchIndex + 1}:`, batchError);
        errors.push(`Batch ${batchIndex + 1} error: ${batchError.message || String(batchError)}`);
      }
    }
    
    console.log(`Import completed. Successfully imported ${importedCount} out of ${records.length} courses.`);
    if (errors.length > 0) {
      console.log(`Encountered ${errors.length} errors during import:`);
      errors.forEach((error, index) => {
        console.log(`Error ${index + 1}: ${error}`);
      });
    }
  } catch (error) {
    console.error('Error in test import:', error);
  } finally {
    // Close the DB connection
    if (db && db.pool) {
      await db.pool.end();
      console.log('Database connection closed');
    }
  }
}

// Run the test
testImportCsv().catch(console.error);