import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { IStorage } from '../storage';
import { InsertCourse } from '@shared/schema';

// Sample image URLs for course thumbnails
const sampleImageUrls = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
  'https://images.unsplash.com/photo-1573164574572-cb89e39749b4',
  'https://images.unsplash.com/photo-1551434678-e076c223a692',
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643',
  'https://images.unsplash.com/photo-1599658880436-c61792e70672',
  'https://images.unsplash.com/photo-1569012871812-f38ee64cd54c',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5'
];

export async function importCoursesFromCSV(storage: IStorage) {
  try {
    const filePath = path.resolve('./attached_assets/Online_Courses.csv');
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      from_line: 2,
      to_line: 1000, // Limit to first 1000 courses for performance
      cast: (value, context) => {
        // Convert empty strings to undefined for non-required fields
        if (value === '') return undefined;
        return value;
      }
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
        // Assign a random image URL
        imageUrl: sampleImageUrls[Math.floor(Math.random() * sampleImageUrls.length)]
      };
      
      // Add image size parameters
      if (courseData.imageUrl) {
        courseData.imageUrl += '?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=225&q=80';
      }
      
      await storage.createCourse(courseData);
    }
  } catch (error) {
    console.error('Error importing courses:', error);
    throw error;
  }
}
