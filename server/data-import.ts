import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { IStorage } from './storage';
import { InsertCourse } from '@shared/schema';

// Main function to import data
export async function importData(storage: IStorage) {
  try {
    await importCoursesFromCSV(storage);
    console.log('Data import completed successfully');
  } catch (error) {
    console.error('Data import failed:', error);
    throw error;
  }
}

// Generate placeholder image for course
function generatePlaceholderImage(category: string, subCategory?: string) {
  // Clean up the text for use in the URL
  const text = subCategory ? 
    `${category}+${subCategory}`.replace(/\s+/g, '+') : 
    category.replace(/\s+/g, '+');
  
  // Generate a unique color based on the category
  const categoryColors: Record<string, string> = {
    'Data Science': '4a6cf7',
    'Business': '6c5ce7',
    'Computer Science': '00b894',
    'Information Technology': '0984e3',
    'Arts and Humanities': 'd63031',
    'Mathematics': '8e44ad',
    'Health': '27ae60',
    'Social Sciences': 'e84393',
    'Engineering': 'f39c12',
    'Language Learning': '2d3436'
  };
  
  const color = categoryColors[category] || '4a6cf7';
  
  return `https://placehold.co/600x400/${color}/ffffff?text=${text}`;
}

// Helper function to import courses from CSV
async function importCoursesFromCSV(storage: IStorage) {
  try {
    const filePath = path.resolve('./attached_assets/Online_Courses.csv');
    if (!fs.existsSync(filePath)) {
      console.error(`CSV file not found at ${filePath}`);
      return;
    }
    
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    
    // Parse CSV - the first field is an index column without a header name
    const allRecords = parse(fileContent, {
      columns: (header) => {
        // The first column doesn't have a header name, so we'll explicitly name it "index"
        header[0] = "index";
        return header;
      },
      skip_empty_lines: true,
      from_line: 1, // Start from the first line (header)
      relax_column_count: true
    });
    
    // Use all courses from the CSV file
    const records = allRecords;
    
    console.log(`Found ${allRecords.length} courses, importing all of them`);
    
    // Process courses in batches of 100 for better performance
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const courseBatch: InsertCourse[] = [];
      
      // Prepare batch of courses
      for (const record of batch) {
        const courseData: InsertCourse = {
          title: record.Title || 'Untitled Course',
          url: record.URL || '#',
          shortIntro: record['Short Intro'],
          category: record.Category,
          subCategory: record['Sub-Category'],
          courseType: record['Course Type'],
          language: record.Language,
          subtitleLanguages: record['Subtitle Languages'],
          skills: record.Skills,
          instructors: record.Instructors,
          rating: record.Rating ? parseFloat(record.Rating.replace('stars', '')) : undefined,
          numberOfViewers: record['Number of viewers'] ? 
            parseInt(record['Number of viewers'].replace(/,/g, '').trim()) : undefined,
          duration: record.Duration,
          site: record.Site,
          imageUrl: generatePlaceholderImage(record.Category || 'Online Course', record['Sub-Category'])
        };
        
        courseBatch.push(courseData);
      }
      
      // Import batch of courses
      await Promise.all(courseBatch.map(course => storage.createCourse(course)));
      console.log(`Imported batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)} (${i} to ${Math.min(i + batchSize, records.length)} courses)`);
    }
    
    console.log('Courses imported successfully');
  } catch (error) {
    console.error('Error importing courses:', error);
    throw error;
  }
}
