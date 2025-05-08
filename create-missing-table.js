import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import "dotenv/config";

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

// Get the database connection string from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString });

// Tables to check and create if missing
const tablesToCheck = [
  {
    name: "user_events",
    createSql: `
      CREATE TABLE user_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        location TEXT,
        is_all_day BOOLEAN DEFAULT FALSE,
        is_completed BOOLEAN DEFAULT FALSE,
        reminder_set BOOLEAN DEFAULT FALSE,
        reminder_time TIMESTAMP,
        color TEXT,
        event_type VARCHAR(50) DEFAULT 'learning' NOT NULL,
        related_course_id INTEGER REFERENCES courses(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP
      );
    `,
  },
  {
    name: "learning_posts",
    createSql: `
      CREATE TABLE learning_posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        post_type VARCHAR(50) NOT NULL,
        tags TEXT[],
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP
      );
    `,
  },
  {
    name: "learning_post_comments",
    createSql: `
      CREATE TABLE learning_post_comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES learning_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP
      );
    `,
  },
  {
    name: "learning_post_likes",
    createSql: `
      CREATE TABLE learning_post_likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES learning_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `,
  },
  {
    name: "learning_post_bookmarks",
    createSql: `
      CREATE TABLE learning_post_bookmarks (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES learning_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `,
  },
  {
    name: "user_notes",
    createSql: `
      CREATE TABLE user_notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        page_url TEXT,
        page_title TEXT,
        course_id INTEGER REFERENCES courses(id),
        tags TEXT[],
        color TEXT DEFAULT '#FFFFFF',
        is_pinned BOOLEAN DEFAULT FALSE,
        image_url TEXT,
        font_size TEXT DEFAULT 'normal',
        position TEXT,
        is_expanded BOOLEAN DEFAULT FALSE,
        text_alignment TEXT DEFAULT 'left',
        is_rich_text BOOLEAN DEFAULT FALSE,
        timestamp TEXT,
        reminder_date TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP
      );
    `,
  },
];

async function checkAndCreateTables() {
  const client = await pool.connect();
  try {
    for (const table of tablesToCheck) {
      // Check if the table exists
      const checkTableResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table.name}'
        );
      `);

      const tableExists = checkTableResult.rows[0].exists;

      if (!tableExists) {
        console.log(`${table.name} table doesn't exist. Creating it now...`);

        try {
          // Create the table
          await client.query(table.createSql);
          console.log(`${table.name} table created successfully`);
        } catch (error) {
          console.error(`Error creating ${table.name} table:`, error);
        }
      } else {
        console.log(`${table.name} table already exists`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAndCreateTables();
