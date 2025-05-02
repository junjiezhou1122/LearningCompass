import { db } from "../db";
import { sql } from "drizzle-orm";

// This migration adds new columns to the user_notes table to support enhanced note-taking features

export async function addAdvancedNotesFeatures() {
  try {
    console.log('Starting migration to add advanced features to user_notes table...');
    
    // Check if columns already exist to avoid errors
    const checkTextAlignmentColumn = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user_notes' AND column_name = 'text_alignment';
    `);
    
    const checkIsRichTextColumn = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user_notes' AND column_name = 'is_rich_text';
    `);
    
    const checkTimestampColumn = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user_notes' AND column_name = 'timestamp';
    `);
    
    const checkReminderDateColumn = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user_notes' AND column_name = 'reminder_date';
    `);
    
    // Add missing columns
    if (!checkTextAlignmentColumn.rows.length) {
      console.log('Adding text_alignment column...');
      await db.execute(sql`ALTER TABLE user_notes ADD COLUMN text_alignment TEXT DEFAULT 'left';`);
    } else {
      console.log('text_alignment column already exists.');
    }
    
    if (!checkIsRichTextColumn.rows.length) {
      console.log('Adding is_rich_text column...');
      await db.execute(sql`ALTER TABLE user_notes ADD COLUMN is_rich_text BOOLEAN DEFAULT false;`);
    } else {
      console.log('is_rich_text column already exists.');
    }
    
    if (!checkTimestampColumn.rows.length) {
      console.log('Adding timestamp column...');
      await db.execute(sql`ALTER TABLE user_notes ADD COLUMN timestamp TEXT;`);
    } else {
      console.log('timestamp column already exists.');
    }
    
    if (!checkReminderDateColumn.rows.length) {
      console.log('Adding reminder_date column...');
      await db.execute(sql`ALTER TABLE user_notes ADD COLUMN reminder_date TEXT;`);
    } else {
      console.log('reminder_date column already exists.');
    }
    
    console.log('Advanced features migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Error during migration:', error);
    return false;
  }
}
