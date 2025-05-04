import { db } from './server/db.js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

async function pushSchema() {
  try {
    console.log('Pushing schema changes to database...');
    // Create tables for university course comments, resources and collaborations
    await db.execute(`
      CREATE TABLE IF NOT EXISTS university_course_comments (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES university_courses(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS university_course_resources (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES university_courses(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        resource_type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS university_course_collaborations (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES university_courses(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        message TEXT NOT NULL,
        contact_method TEXT NOT NULL,
        contact_details TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP
      );
    `);
    console.log('Schema changes successfully pushed to database.');
  } catch (error) {
    console.error('Error pushing schema changes:', error);
  } finally {
    process.exit(0);
  }
}

pushSchema();
