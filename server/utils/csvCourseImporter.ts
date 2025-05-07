import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { IStorage } from '../storage';
import { InsertCourse, InsertUniversityCourse } from '@shared/schema';

interface OnlineCourseColumnMapping {
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

interface UniversityCourseColumnMapping {
  title: string;
  url: string;
  shortIntro?: string;
  category?: string;
  subCategory?: string;
  courseCode?: string;
  department?: string;
  professor?: string;
  credits?: string;
  semester?: string;
  academicYear?: string;
  campus?: string;
  prerequisites?: string;
  format?: string;
  imageUrl?: string;
}

type ColumnMapping = OnlineCourseColumnMapping | UniversityCourseColumnMapping;

/**
 * Imports courses from a CSV file based on a provided column mapping
 */
export async function importCoursesFromUserCSV(
  filePath: string, 
  columnMapping: ColumnMapping,
  storage: IStorage,
  courseType: 'online' | 'university' = 'online'
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
    
    console.log(`Found ${records.length} ${courseType} courses in CSV file ready for import`);
    
    // Track errors
    const errors: string[] = [];
    let importedCount = 0;
    
    // Use the appropriate import method based on courseType
    if (courseType === 'university') {
      return await importUniversityCoursesFromCSV(records, columnMapping as UniversityCourseColumnMapping, storage, errors);
    } else {
      return await importOnlineCoursesFromCSV(records, columnMapping as OnlineCourseColumnMapping, storage, errors);
    }
    
  } catch (error) {
    console.error(`Error importing ${courseType} courses from CSV:`, error);
    return {
      success: false,
      count: 0,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

/**
 * Imports online courses from parsed CSV records
 */
async function importOnlineCoursesFromCSV(
  records: Record<string, any>[],
  columnMapping: OnlineCourseColumnMapping,
  storage: IStorage,
  errors: string[] = []
): Promise<{ success: boolean; count: number; errors: string[] }> {
  let importedCount = 0;
  
  // Process and import online courses
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
      console.error(`Error importing online course at row ${i + 2}:`, error);
      errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return {
    success: importedCount > 0,
    count: importedCount,
    errors: errors
  };
}

/**
 * Imports university courses from parsed CSV records
 */
async function importUniversityCoursesFromCSV(
  records: Record<string, any>[],
  columnMapping: UniversityCourseColumnMapping,
  storage: IStorage,
  errors: string[] = []
): Promise<{ success: boolean; count: number; errors: string[] }> {
  let importedCount = 0;
  
  // Process records in batches for better performance
  const BATCH_SIZE = 25; // Process 25 records at a time
  const totalBatches = Math.ceil(records.length / BATCH_SIZE);
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const startIdx = batchIndex * BATCH_SIZE;
    const endIdx = Math.min(startIdx + BATCH_SIZE, records.length);
    const batchRecords = records.slice(startIdx, endIdx);
    console.log(`Processing batch ${batchIndex + 1} of ${totalBatches} (${batchRecords.length} records)`);
    
    // Process each batch with a database transaction
    try {
      // Prepare all the university course data for this batch
      const batchCourseData: { course: InsertUniversityCourse, url: string | undefined, index: number }[] = [];
      
      // Pre-process the batch to validate and prepare data
      for (let j = 0; j < batchRecords.length; j++) {
        const record = batchRecords[j];
        const recordIndex = startIdx + j;
        
        try {
          // For required fields, use the columnMapping to locate them in the record
          const courseTitle = record[columnMapping.title];
          
          // Use URL field for course link 
          const url = record[columnMapping.url];
          
          // Validate required fields
          if (!courseTitle) {
            errors.push(`Row ${recordIndex + 2}: Missing required field (title)`);
            continue;
          }
          
          // Map department and course code fields
          const department = columnMapping.department ? record[columnMapping.department] : '';
          const courseNumber = columnMapping.courseCode ? record[columnMapping.courseCode] : '';
          
          // Determine university from a field or use a default value
          const university = record.university || "University";
          
          // Create university course data with mappings from the CSV
          const universityCourseData: InsertUniversityCourse = {
            university: university,
            courseDept: department,
            courseNumber: courseNumber || 'N/A',
            courseTitle: courseTitle,
            description: columnMapping.shortIntro ? record[columnMapping.shortIntro] : undefined,
            professors: columnMapping.professor ? record[columnMapping.professor] : undefined,
            recentSemesters: columnMapping.semester ? record[columnMapping.semester] : undefined,
            credits: columnMapping.credits ? record[columnMapping.credits] : undefined
          };
          
          // Add to batch data with URL for later processing
          batchCourseData.push({
            course: universityCourseData,
            url: url,
            index: recordIndex
          });
        } catch (error) {
          console.error(`Error preparing university course at row ${recordIndex + 2}:`, error);
          errors.push(`Row ${recordIndex + 2}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // Now process the batch with the database
      for (const courseData of batchCourseData) {
        try {
          // Store university course in database
          const createdCourse = await storage.createUniversityCourse(courseData.course);
          
          // If a URL was provided, also create a link for the course
          if (courseData.url && createdCourse && createdCourse.id) {
            await storage.createUniversityCourseLink({
              courseId: createdCourse.id,
              url: courseData.url,
              title: "Course Link",
              description: "Main course link"
            });
          }
          
          importedCount++;
        } catch (error) {
          console.error(`Error importing university course at row ${courseData.index + 2}:`, error);
          errors.push(`Row ${courseData.index + 2}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      console.log(`Successfully processed batch ${batchIndex + 1}, imported ${batchCourseData.length} courses`);
    } catch (batchError) {
      console.error(`Error processing batch ${batchIndex + 1}:`, batchError);
      errors.push(`Batch ${batchIndex + 1} error: ${batchError instanceof Error ? batchError.message : String(batchError)}`);
    }
  }
  
  return {
    success: importedCount > 0,
    count: importedCount,
    errors: errors
  };
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
export function generateColumnMapping(headers: string[], courseType: 'online' | 'university' = 'online'): ColumnMapping {
  const mapping: ColumnMapping = {
    title: '',
    url: ''
  };
  
  // Common field name patterns for both course types
  const commonPatterns = {
    title: ['title', 'name', 'course title', 'course name', 'course'],
    url: ['url', 'link', 'course url', 'course link', 'website', 'web address'],
    shortIntro: ['intro', 'introduction', 'short intro', 'description', 'short description', 'overview'],
    category: ['category', 'categories', 'course category'],
    subCategory: ['sub-category', 'subcategory', 'sub category', 'subject', 'topic'],
    imageUrl: ['image', 'image url', 'thumbnail', 'photo', 'picture']
  };
  
  // Online course specific patterns
  const onlineCoursePatterns = {
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
  
  // University course specific patterns
  const universityCoursePatterns = {
    courseCode: ['course code', 'code', 'number', 'course number', 'course id', 'id'],
    department: ['department', 'dept', 'division', 'school', 'faculty'],
    professor: ['professor', 'instructor', 'teacher', 'lecturer', 'faculty member', 'taught by'],
    credits: ['credits', 'credit hours', 'units', 'points'],
    semester: ['semester', 'term', 'period', 'session'],
    academicYear: ['year', 'academic year', 'session'],
    campus: ['campus', 'location', 'building', 'venue'],
    prerequisites: ['prerequisites', 'prereq', 'requirements', 'prior courses', 'required courses'],
    format: ['format', 'delivery', 'mode', 'class type', 'course format']
  };
  
  // Combine the patterns based on course type
  const patterns = {
    ...commonPatterns,
    ...(courseType === 'online' ? onlineCoursePatterns : universityCoursePatterns)
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