// Run the migration to add tags to university_course_resources
import migrateTags from './migrations/add-tags-to-university-course-resources.js';

async function runMigration() {
  try {
    console.log('Starting tags migration...');
    await migrateTags();
    console.log('Tags migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
