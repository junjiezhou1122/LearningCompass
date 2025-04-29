import { db } from './db';
import { courses } from '@shared/schema';
import { importCoursesFromCSV } from './utils/courseParser';
import { storage } from './storage';

async function resetDatabase() {
  try {
    console.log('Clearing existing courses...');
    // Delete all existing courses
    await db.delete(courses);
    
    console.log('Importing courses from CSV...');
    // Import courses from CSV
    await importCoursesFromCSV(storage);
    
    console.log('Database reset complete!');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

resetDatabase();