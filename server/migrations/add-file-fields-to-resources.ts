import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function addFileFieldsToResources() {
  console.log('Starting migration to add file-related fields to university_course_resources table...');
  try {
    // Check if the database connection is working
    await db.execute(sql`SELECT 1`);
    console.log('Database connection successful');

    // Check if column exists before trying to add it
    const checkFilePathColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'university_course_resources' AND column_name = 'file_path'
    `);
    
    if (checkFilePathColumn.rows?.length === 0) {
      console.log('Adding file_path column...');
      await db.execute(sql`ALTER TABLE university_course_resources ADD COLUMN IF NOT EXISTS file_path TEXT`);
    } else {
      console.log('file_path column already exists.');
    }

    // Check if column exists before trying to add it
    const checkFileNameColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'university_course_resources' AND column_name = 'file_name'
    `);
    
    if (checkFileNameColumn.rows?.length === 0) {
      console.log('Adding file_name column...');
      await db.execute(sql`ALTER TABLE university_course_resources ADD COLUMN IF NOT EXISTS file_name TEXT`);
    } else {
      console.log('file_name column already exists.');
    }

    // Check if column exists before trying to add it
    const checkFileSizeColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'university_course_resources' AND column_name = 'file_size'
    `);
    
    if (checkFileSizeColumn.rows?.length === 0) {
      console.log('Adding file_size column...');
      await db.execute(sql`ALTER TABLE university_course_resources ADD COLUMN IF NOT EXISTS file_size INTEGER`);
    } else {
      console.log('file_size column already exists.');
    }

    // Check if column exists before trying to add it
    const checkMimeTypeColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'university_course_resources' AND column_name = 'mime_type'
    `);
    
    if (checkMimeTypeColumn.rows?.length === 0) {
      console.log('Adding mime_type column...');
      await db.execute(sql`ALTER TABLE university_course_resources ADD COLUMN IF NOT EXISTS mime_type TEXT`);
    } else {
      console.log('mime_type column already exists.');
    }

    // Make url column nullable if it's not already
    await db.execute(sql`ALTER TABLE university_course_resources ALTER COLUMN url DROP NOT NULL`);
    
    console.log('Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Error during migration:', error);
    return false;
  }
}
