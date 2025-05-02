import { db } from "../db";
import { sql } from "drizzle-orm";

// This migration adds new columns to the user_notes table to support enhanced note-taking features

export async function addNotesFeatures() {
  try {
    console.log('Starting migration to add new columns to user_notes table...');
    
    // Check if columns already exist to avoid errors
    const checkImageUrlColumn = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user_notes' AND column_name = 'image_url';
    `);
    
    const checkFontSizeColumn = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user_notes' AND column_name = 'font_size';
    `);
    
    const checkPositionColumn = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user_notes' AND column_name = 'position';
    `);
    
    const checkIsExpandedColumn = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user_notes' AND column_name = 'is_expanded';
    `);
    
    // Add missing columns
    if (!checkImageUrlColumn.rows.length) {
      console.log('Adding image_url column...');
      await db.execute(sql`ALTER TABLE user_notes ADD COLUMN image_url TEXT;`);
    } else {
      console.log('image_url column already exists.');
    }
    
    if (!checkFontSizeColumn.rows.length) {
      console.log('Adding font_size column...');
      await db.execute(sql`ALTER TABLE user_notes ADD COLUMN font_size TEXT DEFAULT 'normal';`);
    } else {
      console.log('font_size column already exists.');
    }
    
    if (!checkPositionColumn.rows.length) {
      console.log('Adding position column...');
      await db.execute(sql`ALTER TABLE user_notes ADD COLUMN position TEXT;`);
    } else {
      console.log('position column already exists.');
    }
    
    if (!checkIsExpandedColumn.rows.length) {
      console.log('Adding is_expanded column...');
      await db.execute(sql`ALTER TABLE user_notes ADD COLUMN is_expanded BOOLEAN DEFAULT false;`);
    } else {
      console.log('is_expanded column already exists.');
    }
    
    console.log('Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Error during migration:', error);
    return false;
  }
}
