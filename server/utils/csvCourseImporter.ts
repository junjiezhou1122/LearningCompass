/**
 * CSV course importer with progress tracking and error handling
 */

import * as fs from "fs";
import { parse } from "csv-parse/sync";
import { IStorage } from "../storage";
import * as progressTracker from "./importProgressTracker";
import { ensureConnection } from "../db";

export type ImportResult = {
  success: boolean;
  count: number;
  errors: string[];
  jobId?: string;
};

/**
 * Import courses from a CSV file with progress tracking
 */
export async function importCoursesFromCSV(
  filePath: string,
  columnMapping: Record<string, string>,
  storage: IStorage,
  courseType: "online" | "university",
  batchSize: number = 15,
  userId: number,
  jobId?: string
): Promise<ImportResult> {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      count: 0,
      errors: [`File not found: ${filePath}`],
    };
  }

  try {
    // Read the CSV file
    let fileContent;
    try {
      fileContent = fs.readFileSync(filePath, { encoding: "utf-8" });
    } catch (readError) {
      console.error("Error reading CSV file:", readError);
      return {
        success: false,
        count: 0,
        errors: [
          `Error reading file: ${
            readError instanceof Error ? readError.message : String(readError)
          }`,
        ],
      };
    }

    let records;
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
        cast: (value) => (value === "" ? undefined : value),
      });
    } catch (parseError) {
      console.error("Error parsing CSV:", parseError);
      return {
        success: false,
        count: 0,
        errors: [
          `Error parsing CSV: ${
            parseError instanceof Error
              ? parseError.message
              : String(parseError)
          }`,
        ],
      };
    }

    // If no records found, return error
    if (records.length === 0) {
      // Delete the temporary file since there's nothing to process
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Failed to delete temporary file ${filePath}:`, err);
      }
      return {
        success: false,
        count: 0,
        errors: ["No records found in CSV file"],
      };
    }

    console.log(`Found ${records.length} records in CSV file`);

    // Create a new import job if not provided
    if (!jobId) {
      jobId = progressTracker.createImportJob(
        userId,
        courseType,
        filePath,
        records.length
      );
    }

    // Track import progress
    progressTracker.updateImportJobProgress(jobId, 0, "processing");

    // For very large files, adjust batch size dynamically
    const adjustedBatchSize =
      records.length > 150 ? Math.min(batchSize, 10) : batchSize;
    console.log(
      `Using batch size of ${adjustedBatchSize} for ${records.length} records`
    );

    // Process records in batches
    const errors: string[] = [];
    let importedCount = 0;
    const totalBatches = Math.ceil(records.length / adjustedBatchSize);

    // Add a connection check before starting the import
    const initialConnectionCheck = await ensureConnection();
    if (!initialConnectionCheck) {
      const connectionError =
        "Database connection failed before starting import";
      progressTracker.setImportJobError(jobId, connectionError);
      return {
        success: false,
        count: 0,
        errors: [connectionError],
        jobId,
      };
    }

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * adjustedBatchSize;
      const endIdx = Math.min(startIdx + adjustedBatchSize, records.length);
      const batchRecords = records.slice(startIdx, endIdx);

      console.log(
        `Processing batch ${batchIndex + 1}/${totalBatches} (${startIdx} to ${
          endIdx - 1
        })`
      );

      // Re-check connection before each batch
      await ensureConnection();

      try {
        // Process each record in the batch
        for (let i = 0; i < batchRecords.length; i++) {
          const record = batchRecords[i];
          const recordIndex = startIdx + i;

          // Implement retry logic for each record
          let retryCount = 0;
          let success = false;
          const MAX_RETRIES = 3;

          while (!success && retryCount < MAX_RETRIES) {
            try {
              // Map CSV columns to fields based on user-provided mapping
              const mappedRecord: Record<string, any> = {};

              // Apply column mapping
              for (const [field, column] of Object.entries(columnMapping)) {
                if (column && record[column] !== undefined) {
                  mappedRecord[field] = record[column];
                }
              }

              // Validate required fields
              if (courseType === "online") {
                if (!mappedRecord.title || !mappedRecord.url) {
                  const errorMsg = `Row ${
                    recordIndex + 2
                  }: Missing required fields (title or url)`;
                  errors.push(errorMsg);
                  progressTracker.addImportJobWarning(jobId, errorMsg);
                  break; // Exit retry loop for this record
                }

                // Import online course
                await importOnlineCourse(mappedRecord, storage);
              } else {
                if (!mappedRecord.courseTitle && !mappedRecord.title) {
                  const errorMsg = `Row ${
                    recordIndex + 2
                  }: Missing required field (title)`;
                  errors.push(errorMsg);
                  progressTracker.addImportJobWarning(jobId, errorMsg);
                  break; // Exit retry loop for this record
                }

                // Import university course
                await importUniversityCourse(mappedRecord, storage);
              }

              // Increment counter
              importedCount++;
              success = true;

              // Update progress every record to ensure real-time tracking
              progressTracker.updateImportJobProgress(jobId, importedCount);
            } catch (error) {
              retryCount++;

              if (retryCount < MAX_RETRIES) {
                console.warn(
                  `Error on row ${
                    recordIndex + 2
                  }, retry attempt ${retryCount}/${MAX_RETRIES}`
                );

                // Check connection and try to recover if needed
                const isConnected = await ensureConnection();
                if (!isConnected) {
                  console.warn(
                    `Database connection lost during import, waiting before retrying...`
                  );
                  await new Promise((resolve) => setTimeout(resolve, 2000));
                } else {
                  // Small delay between retries even if connection is OK
                  await new Promise((resolve) => setTimeout(resolve, 500));
                }
              } else {
                // All retries failed
                const errorMsg = `Row ${recordIndex + 2}: ${
                  error instanceof Error ? error.message : String(error)
                }`;
                console.error(
                  `Error importing ${courseType} course after ${MAX_RETRIES} attempts:`,
                  errorMsg
                );
                errors.push(errorMsg);
                progressTracker.addImportJobWarning(jobId, errorMsg);
                success = true; // Stop retrying
              }
            }
          } // End of retry loop
        }

        // Add a small delay between batches to allow database connection recovery
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log(
          `Batch ${
            batchIndex + 1
          }/${totalBatches} completed. Progress: ${importedCount}/${
            records.length
          }`
        );
      } catch (batchError) {
        console.error(`Error processing batch ${batchIndex + 1}:`, batchError);
        const batchErrorMsg = `Batch ${batchIndex + 1}: ${
          batchError instanceof Error ? batchError.message : String(batchError)
        }`;
        errors.push(batchErrorMsg);
        progressTracker.addImportJobWarning(jobId, batchErrorMsg);

        // Allow the import to continue with the next batch even if a batch fails
        console.log(`Continuing with next batch after error`);

        // Add a longer delay after a batch error to give the database connection time to recover
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    // Mark import as completed
    progressTracker.updateImportJobProgress(jobId, importedCount, "completed");

    // Only delete the file after successful processing
    try {
      fs.unlinkSync(filePath);
      console.log(`Successfully deleted temporary file ${filePath}`);
    } catch (err) {
      console.error(`Failed to delete temporary file ${filePath}:`, err);
    }

    // Return results
    return {
      success: true,
      count: importedCount,
      errors,
      jobId,
    };
  } catch (error) {
    console.error("Error in CSV import:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (jobId) {
      progressTracker.setImportJobError(jobId, errorMsg);
    }

    // Do NOT delete the file on error - it may be needed for debugging

    return {
      success: false,
      count: 0,
      errors: [errorMsg],
      jobId,
    };
  }
}

/**
 * Import an online course from a mapped record
 */
async function importOnlineCourse(
  mappedRecord: Record<string, any>,
  storage: IStorage
): Promise<void> {
  // Ensure database connection is active before proceeding
  const connectionOk = await ensureConnection();
  if (!connectionOk) {
    throw new Error("Database connection failed, cannot import course");
  }

  // Prepare the course data
  const courseData: any = {
    title: mappedRecord.title,
    url: mappedRecord.url,
    shortIntro: mappedRecord.shortIntro || mappedRecord.description,
    category: mappedRecord.category,
    subCategory: mappedRecord.subCategory || mappedRecord.subcategory,
    courseType: mappedRecord.courseType,
    language: mappedRecord.language,
    subtitleLanguages: mappedRecord.subtitleLanguages,
    skills: mappedRecord.skills,
    instructors: mappedRecord.instructors || mappedRecord.instructor,
    rating: mappedRecord.rating
      ? parseFloat(String(mappedRecord.rating).replace("stars", ""))
      : undefined,
    numberOfViewers: mappedRecord.numberOfViewers
      ? parseInt(String(mappedRecord.numberOfViewers).replace(/,/g, "").trim())
      : undefined,
    duration: mappedRecord.duration,
    site: mappedRecord.site,
    imageUrl: mappedRecord.imageUrl,
  };

  try {
    // Create the course
    await storage.createCourse(courseData);
  } catch (error) {
    console.error("Error importing online course:", error);
    // Attempt to reconnect before giving up
    await ensureConnection();
    throw error;
  }
}

/**
 * Import a university course from a mapped record
 */
async function importUniversityCourse(
  mappedRecord: Record<string, any>,
  storage: IStorage
): Promise<void> {
  // Ensure database connection is active before proceeding
  const connectionOk = await ensureConnection();
  if (!connectionOk) {
    throw new Error("Database connection failed, cannot import course");
  }

  // Prepare the course data
  const courseTitle = mappedRecord.courseTitle || mappedRecord.title;
  const university = mappedRecord.university || "University";
  const courseDept = mappedRecord.courseDept || mappedRecord.department || "";
  const courseNumber = mappedRecord.courseNumber || mappedRecord.code || "N/A";

  const courseData: any = {
    university,
    courseDept,
    courseNumber,
    courseTitle,
    description: mappedRecord.description,
    professors: mappedRecord.professors || mappedRecord.professor,
    recentSemesters: mappedRecord.recentSemesters || mappedRecord.semester,
    credits: mappedRecord.credits,
  };

  try {
    // Create the university course
    const createdCourse = await storage.createUniversityCourse(courseData);

    // If URL provided, create university course link
    if (mappedRecord.url && createdCourse && createdCourse.id) {
      await storage.createUniversityCourseLink({
        courseId: createdCourse.id,
        url: mappedRecord.url,
        title: "Course Link",
        description: "Main course link",
      });
    }
  } catch (error) {
    console.error("Error importing university course:", error);
    // Attempt to reconnect before giving up
    await ensureConnection();
    throw error;
  }
}
