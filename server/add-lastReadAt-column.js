import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;

async function addLastReadAtColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Adding last_read_at column to chat_group_members table...');
    await pool.query(`
      ALTER TABLE chat_group_members 
      ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    `);
    console.log('Column added successfully.');
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    await pool.end();
  }
}

addLastReadAtColumn().catch(console.error);
