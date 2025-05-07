import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { IStorage } from '../storage';
import { InsertCourse } from '@shared/schema';

interface ColumnMapping {
  title: string;
  url: string;
  shortIntro?: string;
  category?: string;
  subCategory?: string;
  courseType?: string;
  language?: string;
  subtitleLanguages?: string;
  skills?: string;
  instructors?: string;
  rating?: string;
  numberOfViewers?: string;
  duration?: string;
  site?: string;
  imageUrl?: string;
}

/**
 * Imports courses from a CSV file based on a provided column mapping
 */
export async function importCoursesFromUserCSV(
  filePath: string, 
  columnMapping: ColumnMapping,
  storage: IStorage
): Promise<{ success: boolean; count: number; errors: string[] }> {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return { 
        success: false, 
        count: 0, 
        errors: [`CSV file not found at ${filePath}`] 
      };
    }
    
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      cast: (value, context) => {
        // Convert empty strings to undefined for non-required fields
        if (value === '') return undefined;
        return value;
      }
    });
    
    console.log(`Found ${records.length} courses in CSV file ready for import`);
    
    // Track errors
    const errors: string[] = [];
    let importedCount = 0;
    
    // Process and import courses
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // For required fields, use the columnMapping to locate them in the record
        const title = record[columnMapping.title];
        const url = record[columnMapping.url];
        
        // Validate required fields
        if (!title || !url) {
          errors.push(`Row ${i + 2}: Missing required fields (title or url)`);
          continue;
        }
        
        // Create course data with mappings from the CSV
        const courseData: InsertCourse = {
          title: title,
          url: url,
          shortIntro: columnMapping.shortIntro ? record[columnMapping.shortIntro] : undefined,
          category: columnMapping.category ? record[columnMapping.category] : undefined,
          subCategory: columnMapping.subCategory ? record[columnMapping.subCategory] : undefined,
          courseType: columnMapping.courseType ? record[columnMapping.courseType] : undefined,
          language: columnMapping.language ? record[columnMapping.language] : undefined,
          subtitleLanguages: columnMapping.subtitleLanguages ? record[columnMapping.subtitleLanguages] : undefined,
          skills: columnMapping.skills ? record[columnMapping.skills] : undefined,
          instructors: columnMapping.instructors ? record[columnMapping.instructors] : undefined,
          rating: columnMapping.rating && record[columnMapping.rating]
            ? parseFloat(record[columnMapping.rating].toString().replace('stars', ''))
            : undefined,
          numberOfViewers: columnMapping.numberOfViewers && record[columnMapping.numberOfViewers]
            ? parseInt(record[columnMapping.numberOfViewers].toString().replace(/,/g, '').trim())
            : undefined,
          duration: columnMapping.duration ? record[columnMapping.duration] : undefined,
          site: columnMapping.site ? record[columnMapping.site] : undefined,
          imageUrl: columnMapping.imageUrl ? record[columnMapping.imageUrl] : undefined
        };
        
        // Store course in database
        await storage.createCourse(courseData);
        importedCount++;
      } catch (error) {
        console.error(`Error importing course at row ${i + 2}:`, error);
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return {
      success: importedCount > 0,
      count: importedCount,
      errors: errors
    };
  } catch (error) {
    console.error('Error importing courses from CSV:', error);
    return {
      success: false,
      count: 0,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

/**
 * Analyzes a CSV file and returns its headers and a sample of the data
 */
export async function analyzeCSVFile(
  filePath: string
): Promise<{ success: boolean; headers: string[]; sampleData: any[]; error?: string }> {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return { 
        success: false, 
        headers: [], 
        sampleData: [],
        error: `CSV file not found at ${filePath}`
      };
    }
    
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true
    });
    
    // Get headers from the first record
    const headers = records.length > 0 ? Object.keys(records[0]) : [];
    
    // Get sample data (up to 5 rows)
    const sampleData = records.slice(0, 5);
    
    return {
      success: true,
      headers,
      sampleData
    };
  } catch (error) {
    console.error('Error analyzing CSV file:', error);
    return {
      success: false,
      headers: [],
      sampleData: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Attempts to auto-map CSV columns to course fields based on common naming patterns
 */
export function generateColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    title: '',
    url: ''
  };
  
  // Common field name patterns
  const patterns = {
    title: ['title', 'name', 'course title', 'course name', 'course'],
    url: ['url', 'link', 'course url', 'course link', 'website', 'web address'],
    shortIntro: ['intro', 'introduction', 'short intro', 'description', 'short description', 'overview'],
    category: ['category', 'categories', 'course category'],
    subCategory: ['sub-category', 'subcategory', 'sub category', 'subject', 'topic'],
    courseType: ['type', 'course type', 'format'],
    language: ['language', 'course language', 'primary language'],
    subtitleLanguages: ['subtitle languages', 'subtitles', 'captions'],
    skills: ['skills', 'abilities', 'competencies', 'what you will learn', 'learning outcomes'],
    instructors: ['instructor', 'instructors', 'teacher', 'teachers', 'professor', 'professors', 'lecturer', 'lecturers'],
    rating: ['rating', 'stars', 'score', 'course rating'],
    numberOfViewers: ['viewers', 'views', 'students', 'enrollment', 'participants', 'number of viewers'],
    duration: ['duration', 'length', 'time', 'hours', 'course duration', 'course length'],
    site: ['site', 'platform', 'provider', 'source', 'website']
  };
  
  // Try to match each header with the appropriate field
  headers.forEach(header => {
    const lowerHeader = header.toLowerCase();
    
    // Check each field pattern
    Object.entries(patterns).forEach(([field, possibleNames]) => {
      if (possibleNames.some(name => lowerHeader.includes(name))) {
        // @ts-ignore - Dynamic assignment
        mapping[field] = header;
      }
    });
  });
  
  return mapping;
}