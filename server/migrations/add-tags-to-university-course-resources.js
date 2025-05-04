// Migration script to add tags array column to university_course_resources table
import { db } from '../db.js';
import { sql } from 'drizzle-orm';

async function migrateTags() {
  console.log('Starting migration to add tags column to university_course_resources table...');
  try {
    // Check if the column already exists
    const checkColumnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'university_course_resources' AND column_name = 'tags';
    `);
    
    if (checkColumnExists.length > 0) {
      console.log('tags column already exists in university_course_resources table');
      return;
    }
    
    // Add the tags column as text[]
    await db.execute(sql`
      ALTER TABLE university_course_resources 
      ADD COLUMN tags text[] DEFAULT '{}'::text[];
    `);
    
    console.log('Successfully added tags column to university_course_resources table');
  } catch (error) {
    console.error('Error executing migration:', error);
    throw error;
  }
}

export default migrateTags;
