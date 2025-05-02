import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function addChatMessagesFeature() {
  console.log('Starting migration to add chat messages table...');
  
  try {
    // Check if the chat_messages table exists already
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'chat_messages'
      );
    `);
    
    const tableExists = result.rows[0]?.exists === true;
    
    if (!tableExists) {
      // Create chat_messages table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id SERIAL PRIMARY KEY,
          sender_id INTEGER NOT NULL REFERENCES users(id),
          receiver_id INTEGER NOT NULL REFERENCES users(id),
          content TEXT NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP
        );
      `);
      console.log('chat_messages table created successfully!');
    } else {
      console.log('chat_messages table already exists.');
    }
    
    console.log('Chat messages migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Error in chat messages migration:', error);
    throw error;
  }
}