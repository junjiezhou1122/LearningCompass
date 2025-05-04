import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { IStorage } from '../storage';
import { InsertUniversityCourse } from '@shared/schema';

/**
 * Import university courses from a CSV file
 * Expected CSV format: university, course_dept, course_number, course_title, description, professors, recent_semesters, url
 */
export async function importUniversityCoursesFromCSV(storage: IStorage, filePath: string): Promise<{ success: boolean, count: number, message: string }> {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return { success: false, count: 0, message: `CSV file not found at ${filePath}` };
    }
    
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true, // Use the first line as column names
      skip_empty_lines: true,
      trim: true,
      cast: (value, context) => {
        // Convert empty strings to undefined for non-required fields
        if (value === '') return undefined;
        return value;
      }
    });
    
    console.log(`Found ${records.length} university courses in CSV file ready for import`);
    
    // Keep track of import statistics
    let imported = 0;
    let skipped = 0;
    
    // Process courses in batches for better performance
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const importPromises = [];
      
      for (const record of batch) {
        // Map CSV columns to university course data structure
        const courseData: InsertUniversityCourse = {
          university: record.university,
          courseDept: record.course_dept,
          courseNumber: record.course_number,
          courseTitle: record.course_title,
          description: record.description,
          professors: record.professors,
          recentSemesters: record.recent_semesters,
          credits: record.credits,
          url: record.url,
          updatedAt: new Date().toISOString(),
        };
        
        // Check if required fields are present
        if (!courseData.university || !courseData.courseDept || 
            !courseData.courseNumber || !courseData.courseTitle) {
          console.warn('Skipping course due to missing required fields:', 
            JSON.stringify({ 
              university: courseData.university, 
              courseDept: courseData.courseDept,
              courseNumber: courseData.courseNumber,
              courseTitle: courseData.courseTitle 
            }));
          skipped++;
          continue;
        }
        
        // Create a promise to check if course exists and create if not
        const importPromise = async () => {
          try {
            // Check if course already exists
            const existingCourse = await storage.getUniversityCourseByDeptAndNumber(
              courseData.university,
              courseData.courseDept,
              courseData.courseNumber
            );
            
            if (existingCourse) {
              console.log(`Course already exists: ${courseData.university} ${courseData.courseDept} ${courseData.courseNumber}`);
              skipped++;
              return;
            }
            
            // Add course
            await storage.createUniversityCourse(courseData);
            imported++;
          } catch (error) {
            console.error(`Error importing course ${courseData.university} ${courseData.courseDept} ${courseData.courseNumber}:`, error);
            skipped++;
          }
        };
        
        importPromises.push(importPromise());
      }
      
      // Wait for batch to complete
      await Promise.all(importPromises);
      console.log(`Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)} (${i} to ${Math.min(i + batchSize, records.length)} courses)`);
    }
    
    const message = `Import complete: ${imported} courses imported, ${skipped} courses skipped out of ${records.length} total`;
    console.log(message);
    return { success: true, count: imported, message };
  } catch (error) {
    console.error('Error importing university courses:', error);
    return { 
      success: false, 
      count: 0, 
      message: `Error importing university courses: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}
