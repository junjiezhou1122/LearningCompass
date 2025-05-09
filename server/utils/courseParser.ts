import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { IStorage } from '../storage';
import { InsertCourse } from '@shared/schema';

// Course image placeholders with topic-based text
const generatePlaceholderImage = (category: string, subCategory?: string) => {
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
};

export async function importCoursesFromCSV(storage: IStorage) {
  try {
    const filePath = path.resolve('./attached_assets/Online_Courses.csv');
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
      relax_column_count: true,
      cast: (value, context) => {
        // Convert empty strings to undefined for non-required fields
        if (value === '') return undefined;
        return value;
      }
    });
    
    // Use all courses from the CSV file
    const records = allRecords;
    console.log(`Found ${allRecords.length} courses in CSV file ready for import`);
    
    // Process and import courses
    for (const record of records) {
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
        // Generate placeholder image based on category and subcategory
        imageUrl: generatePlaceholderImage(record.Category || 'Online Course', record['Sub-Category'])
      };
      
      await storage.createCourse(courseData);
    }
  } catch (error) {
    console.error('Error importing courses:', error);
    throw error;
  }
}
