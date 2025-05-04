import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from './shared/schema';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function pushSchema() {
  try {
    console.log('Starting schema push...');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    // Create university_courses table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS university_courses (
        id SERIAL PRIMARY KEY,
        university TEXT NOT NULL,
        course_dept TEXT NOT NULL,
        course_number TEXT NOT NULL,
        course_title TEXT NOT NULL,
        description TEXT,
        professors TEXT,
        recent_semesters TEXT,
        credits TEXT,
        url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('Created university_courses table');

    // Create learning_methods table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS learning_methods (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        steps TEXT[],
        tags TEXT[],
        difficulty VARCHAR(20),
        time_required TEXT,
        benefits TEXT[],
        resources TEXT[],
        upvotes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('Created learning_methods table');

    // Create learning_tools table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS learning_tools (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        url TEXT,
        category TEXT,
        pricing TEXT,
        platforms TEXT[],
        pros TEXT[],
        cons TEXT[],
        alternatives TEXT[],
        upvotes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('Created learning_tools table');

    // Create university_course_bookmarks table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS university_course_bookmarks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        university_course_id INTEGER NOT NULL REFERENCES university_courses(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
    console.log('Created university_course_bookmarks table');

    // Create learning_method_reviews table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS learning_method_reviews (
        id SERIAL PRIMARY KEY,
        method_id INTEGER NOT NULL REFERENCES learning_methods(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        rating INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('Created learning_method_reviews table');

    // Create learning_tool_reviews table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS learning_tool_reviews (
        id SERIAL PRIMARY KEY,
        tool_id INTEGER NOT NULL REFERENCES learning_tools(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        rating INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('Created learning_tool_reviews table');

    console.log('Schema push completed successfully!');
    
    await pool.end();
  } catch (error) {
    console.error('Error pushing schema:', error);
  }
}

pushSchema();