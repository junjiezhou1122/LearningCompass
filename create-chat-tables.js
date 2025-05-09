import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function createChatMessagesTable() {
  try {
    console.log("Checking if chat_messages table exists...");

    // Check if table exists
    const tableExistsResult = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages'
      );
    `;

    const tableExists = tableExistsResult[0]?.exists;

    if (tableExists) {
      console.log("chat_messages table already exists. No action needed.");
      return;
    }

    console.log("Creating chat_messages table...");

    // Create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id),
        receiver_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create indexes
    await sql`CREATE INDEX chat_messages_sender_id_idx ON chat_messages(sender_id);`;
    await sql`CREATE INDEX chat_messages_receiver_id_idx ON chat_messages(receiver_id);`;
    await sql`CREATE INDEX chat_messages_created_at_idx ON chat_messages(created_at);`;

    console.log("chat_messages table created successfully!");
  } catch (error) {
    console.error("Error creating chat_messages table:", error);
  }
}

createChatMessagesTable()
  .then(() => {
    console.log("Chat tables setup complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Failed to set up chat tables:", err);
    process.exit(1);
  });
