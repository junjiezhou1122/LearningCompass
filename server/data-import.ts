import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { IStorage } from './storage';
import { InsertCourse } from '@shared/schema';

// Main function to import data
export async function importData(storage: IStorage) {
  try {
    await importCoursesFromCSV(storage);
    console.log('Data import completed successfully');
  } catch (error) {
    console.error('Data import failed:', error);
    throw error;
  }
}

// Helper function to import courses from CSV
async function importCoursesFromCSV(storage: IStorage) {
  try {
    const filePath = path.resolve('./attached_assets/Online_Courses.csv');
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Process and import courses
    for (const record of records) {
      const courseData: InsertCourse = {
        title: record.Title || 'Untitled Course',
        url: record.URL || '#',
        shortIntro: record['Short Intro'],
        category: record.Category,
        subCategory: record['Sub-Category'],
        courseType: record['Course Type'],
        language: record.Language,
        subtitleLanguages: record['Subtitle Languages'],
        skills: record.Skills,
        instructors: record.Instructors,
        rating: record.Rating ? parseFloat(record.Rating) : undefined,
        numberOfViewers: record['Number of viewers'] ? parseInt(record['Number of viewers']) : undefined,
        duration: record.Duration,
        site: record.Site,
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3'
      };
      
      await storage.createCourse(courseData);
    }
  } catch (error) {
    console.error('Error importing courses:', error);
    throw error;
  }
}
