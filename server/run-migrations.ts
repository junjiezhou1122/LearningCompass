import { addNotesFeatures } from './migrations/add_notes_features';
import { addAdvancedNotesFeatures } from './migrations/add_advanced_notes_features';

async function runMigrations() {
  console.log('Starting database migrations...');
  
  // Run migrations sequentially
  const notesMigrationSuccess = await addNotesFeatures();
  if (!notesMigrationSuccess) {
    console.error('Notes features migration failed!');
    process.exit(1);
  }
  
  // Run advanced notes features migration
  const advancedNotesMigrationSuccess = await addAdvancedNotesFeatures();
  if (!advancedNotesMigrationSuccess) {
    console.error('Advanced notes features migration failed!');
    process.exit(1);
  }
  
  console.log('Database migrations completed successfully!');
  process.exit(0);
}

runMigrations().catch(error => {
  console.error('Unhandled error during migrations:', error);
  process.exit(1);
});
