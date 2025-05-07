/**
 * Utility for analyzing CSV files and generating column mappings
 */

import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

export interface CSVPreview {
  filePath: string;
  headers: string[];
  firstRows: Record<string, any>[];
  recordCount: number;
  detectedType: 'online' | 'university' | 'unknown';
}

/**
 * Analyze a CSV file and return header and sample data
 */
export function analyzeCSVFile(filePath: string): CSVPreview {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  try {
    // Read the file
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    
    // Parse the CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true
    });

    // Get headers (from first record)
    const headers = records.length > 0 ? Object.keys(records[0]) : [];
    
    // Take first 5 rows as sample
    const firstRows = records.slice(0, 5);
    
    // Determine if this is a university course CSV or online course CSV
    // Check for common fields in university courses
    const detectedType = detectCourseType(headers, firstRows);
    
    return {
      filePath,
      headers,
      firstRows,
      recordCount: records.length,
      detectedType
    };
  } catch (error) {
    console.error('Error analyzing CSV file:', error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

/**
 * Detect whether the CSV contains university courses or online courses
 */
function detectCourseType(headers: string[], samples: Record<string, any>[]): 'online' | 'university' | 'unknown' {
  // University course indicators
  const universityIndicators = [
    'course_dept', 'courseDept', 'department',
    'university', 'institution',
    'course_number', 'courseNumber', 'code',
    'credits', 'credit_hours',
    'semester', 'term', 'recent_semesters',
    'professors', 'professor', 'instructor_name'
  ];
  
  // Online course indicators
  const onlineIndicators = [
    'site', 'platform', 'website',
    'rating', 'stars', 'reviews',
    'number_of_viewers', 'views', 'students',
    'duration', 'length', 'hours',
    'certificate', 'certification',
    'price', 'cost', 'fee'
  ];
  
  // Count matches for each type
  let universityMatches = 0;
  let onlineMatches = 0;
  
  // Check headers for indicators
  for (const header of headers) {
    const headerLower = header.toLowerCase();
    
    if (universityIndicators.some(indicator => headerLower.includes(indicator.toLowerCase()))) {
      universityMatches++;
    }
    
    if (onlineIndicators.some(indicator => headerLower.includes(indicator.toLowerCase()))) {
      onlineMatches++;
    }
  }
  
  // Also check if any sample data contains key indicators
  if (samples.length > 0) {
    // University indicators in data
    if (samples.some(row => row.university || row.courseNumber || row.courseDept)) {
      universityMatches += 2;
    }
    
    // Online indicators in data
    if (samples.some(row => row.site || row.rating || row.duration)) {
      onlineMatches += 2;
    }
  }
  
  // Determine type based on matches
  if (universityMatches > onlineMatches && universityMatches >= 2) {
    return 'university';
  } else if (onlineMatches > universityMatches && onlineMatches >= 2) {
    return 'online';
  } else {
    // If we can't determine, default to online
    return 'unknown';
  }
}

/**
 * Generate a suggested column mapping based on headers
 */
export function generateColumnMapping(headers: string[], courseType: 'online' | 'university'): Record<string, string> {
  const mapping: Record<string, string> = {};
  const headerMap = headers.reduce((acc, h) => {
    acc[h.toLowerCase()] = h;
    return acc;
  }, {} as Record<string, string>);
  
  if (courseType === 'online') {
    // Map online course fields
    const fieldMappings = {
      'title': ['title', 'course_title', 'name', 'course_name', 'course'],
      'url': ['url', 'link', 'course_url', 'website', 'course_link'],
      'shortIntro': ['short_intro', 'intro', 'introduction', 'description', 'summary', 'overview'],
      'category': ['category', 'main_category', 'primary_category'],
      'subCategory': ['sub_category', 'subcategory', 'secondary_category'],
      'courseType': ['course_type', 'type'],
      'language': ['language', 'course_language', 'primary_language'],
      'subtitleLanguages': ['subtitle_languages', 'subtitles', 'captions'],
      'skills': ['skills', 'topics', 'tags', 'keywords'],
      'instructors': ['instructors', 'instructor', 'teacher', 'teachers', 'presenter', 'presenters'],
      'rating': ['rating', 'stars', 'score', 'review_score'],
      'numberOfViewers': ['number_of_viewers', 'viewers', 'students', 'enrollments', 'learners'],
      'duration': ['duration', 'length', 'time', 'hours'],
      'site': ['site', 'platform', 'provider', 'website_name'],
      'imageUrl': ['image_url', 'thumbnail', 'image', 'picture', 'cover_image']
    };
    
    // Try to match each field
    for (const [field, possibleHeaders] of Object.entries(fieldMappings)) {
      for (const possibleHeader of possibleHeaders) {
        if (headerMap[possibleHeader]) {
          mapping[field] = headerMap[possibleHeader];
          break;
        }
      }
    }
  } else {
    // Map university course fields
    const fieldMappings = {
      'courseTitle': ['course_title', 'title', 'name', 'course_name', 'course'],
      'university': ['university', 'institution', 'school', 'college'],
      'courseDept': ['course_dept', 'department', 'dept', 'subject'],
      'courseNumber': ['course_number', 'number', 'code', 'course_code'],
      'description': ['description', 'course_description', 'overview', 'summary'],
      'professors': ['professors', 'professor', 'instructor', 'instructors', 'faculty'],
      'recentSemesters': ['recent_semesters', 'semesters', 'terms', 'offerings'],
      'credits': ['credits', 'credit_hours', 'units'],
      'url': ['url', 'link', 'course_url', 'website']
    };
    
    // Try to match each field
    for (const [field, possibleHeaders] of Object.entries(fieldMappings)) {
      for (const possibleHeader of possibleHeaders) {
        if (headerMap[possibleHeader]) {
          mapping[field] = headerMap[possibleHeader];
          break;
        }
      }
    }
  }
  
  return mapping;
}