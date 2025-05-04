import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function addGroupChatFeature() {
  console.log('Starting migration to add group chat tables...');
  
  try {
    // Check if the chat_groups table exists already
    const groupsResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'chat_groups'
      );
    `);
    
    const groupsTableExists = groupsResult.rows[0]?.exists === true;
    
    if (!groupsTableExists) {
      // Create chat_groups table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS chat_groups (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          creator_id INTEGER NOT NULL REFERENCES users(id),
          is_private BOOLEAN NOT NULL DEFAULT true,
          avatar TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP
        );
      `);
      console.log('chat_groups table created successfully!');
      
      // Create chat_group_members table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS chat_group_members (
          id SERIAL PRIMARY KEY,
          group_id INTEGER NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role TEXT DEFAULT 'member',
          joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
          last_read_timestamp TIMESTAMP,
          UNIQUE(group_id, user_id)
        );
      `);
      console.log('chat_group_members table created successfully!');
      
      // Create chat_group_messages table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS chat_group_messages (
          id SERIAL PRIMARY KEY,
          group_id INTEGER NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
          sender_id INTEGER NOT NULL REFERENCES users(id),
          content TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log('chat_group_messages table created successfully!');
      
      // Create chat_group_invitations table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS chat_group_invitations (
          id SERIAL PRIMARY KEY,
          group_id INTEGER NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
          inviter_id INTEGER NOT NULL REFERENCES users(id),
          invitee_id INTEGER NOT NULL REFERENCES users(id),
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          responded_at TIMESTAMP,
          UNIQUE(group_id, invitee_id)
        );
      `);
      console.log('chat_group_invitations table created successfully!');
      
      // Create chat_group_applications table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS chat_group_applications (
          id SERIAL PRIMARY KEY,
          group_id INTEGER NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
          applicant_id INTEGER NOT NULL REFERENCES users(id),
          message TEXT,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          responded_at TIMESTAMP,
          responder_id INTEGER REFERENCES users(id),
          UNIQUE(group_id, applicant_id)
        );
      `);
      console.log('chat_group_applications table created successfully!');
    } else {
      console.log('Group chat tables already exist.');
    }
    
    console.log('Group chat migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Error in group chat migration:', error);
    throw error;
  }
}