import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { initializeSocketIO } from "./utils/socketio"; // Import the Socket.IO initialization function
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { handleChatRequest } from "./ai-service";
import { upload, getRelativePath, getAbsolutePath } from "./utils/multer";
import fs from "fs";
import {
  insertUserSchema,
  insertBookmarkSchema,
  insertSubscriberSchema,
  insertCommentSchema,
  insertSearchHistorySchema,
  // Learning post schemas
  insertLearningPostSchema,
  insertLearningPostCommentSchema,
  insertLearningPostLikeSchema,
  insertLearningPostBookmarkSchema,
  // AI conversation schema
  insertAiConversationSchema,
  // Method application schema
  insertMethodApplicationSchema,
  // User notes schema
  insertUserNoteSchema,
  // Learning Center schemas
  insertUniversityCourseSchema,
  insertUniversityCourseBookmarkSchema,
  insertUniversityCourseCommentSchema,
  insertUniversityCourseResourceSchema,
  insertUniversityCourseCollaborationSchema,
  insertUniversityCourseLinkSchema,
  insertLearningMethodSchema,
  insertLearningMethodReviewSchema,
  insertLearningMethodCommentSchema,
  insertLearningToolSchema,
  insertLearningToolReviewSchema,
  // Chat message schema
  insertChatMessageSchema,
  // Types
  LearningPost,
} from "@shared/schema";
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { parse } from "csv-parse/sync";
// Import data already complete
// import { importCoursesFromCSV } from "./utils/courseParser";
import { authenticateJWT, generateToken } from "./utils/auth";
import { analyzeCSVFile, generateColumnMapping } from "./utils/csvAnalyzer";
import { importCoursesFromCSV } from "./utils/csvCourseImporter";
import * as progressTracker from "./utils/importProgressTracker";
import csv from "csv-parser";

// Test the validity of a JWT token for debugging purposes
function validateToken(token: string): {
  valid: boolean;
  payload?: any;
  error?: string;
} {
  try {
    if (!token) {
      return { valid: false, error: "No token provided" };
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret_key"
    );
    return { valid: true, payload: decoded };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export async function registerRoutes(app: Express): Promise<Server> {
  // Skip import since courses are already in the database
  console.log("Skipping course import as data is already in the database");

  // Newsletter subscription route
  app.post("/api/subscribe", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      // Validate email
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const emailSchema = z.string().email();
      try {
        emailSchema.parse(email);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid email format" });
        }
      }

      // Check if subscriber already exists
      const existingSubscriber = await storage.getSubscriberByEmail(email);
      if (existingSubscriber) {
        return res
          .status(200)
          .header("Content-Type", "application/json")
          .json({ message: "You're already subscribed to our newsletter!" });
      }

      // Create subscriber
      const subscriberData = insertSubscriberSchema.parse({
        email,
        createdAt: new Date().toISOString(),
        status: "active",
      });

      await storage.createSubscriber(subscriberData);

      res
        .status(201)
        .header("Content-Type", "application/json")
        .json({ message: "Successfully subscribed to the newsletter!" });
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      res
        .status(500)
        .header("Content-Type", "application/json")
        .json({ message: "Error processing subscription" });
    }
  });

  // Auth routes

  // Test endpoint to generate tokens (for development only)
  app.get(
    "/api/auth/test-token/:userId",
    async (req: Request, res: Response) => {
      try {
        const userId = req.params.userId;

        // Find user by numeric ID, firebase ID, or username
        let user;
        const numericId = parseInt(userId);

        if (!isNaN(numericId)) {
          user = await storage.getUser(numericId);
        }

        if (!user && /^[A-Za-z0-9]{20,}$/.test(userId)) {
          user = await storage.getUserByFirebaseId(userId);
        }

        if (!user && userId.length < 20) {
          user = await storage.getUserByUsername(userId);
        }

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Generate token
        const token = generateToken(user);
        res.json({ token, user: { ...user, password: undefined } });
      } catch (error) {
        console.error("Error generating test token:", error);
        res.status(500).json({ message: "Error generating test token" });
      }
    }
  );

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse({
        ...req.body,
        createdAt: new Date().toISOString(),
      });

      // Check if user already exists
      const existingUser =
        (await storage.getUserByUsername(userData.username)) ||
        (await storage.getUserByEmail(userData.email));

      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user with hashed password
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate token
      const token = generateToken(newUser);

      // Return user data (excluding password) and token
      const { password, ...userWithoutPassword } = newUser;

      res.status(201).json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });

  // Debug endpoint to validate tokens
  app.post("/api/auth/validate-token", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const validation = validateToken(token);
      res.json(validation);
    } catch (error) {
      console.error("Error validating token:", error);
      res.status(500).json({ message: "Error validating token" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "Username and password are required" });
      }

      // Find user
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = generateToken(user);

      // Return user data (excluding password) and token
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Course routes
  app.get("/api/courses", async (req: Request, res: Response) => {
    try {
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        category: req.query.category as string | undefined,
        subCategory: req.query.subCategory as string | undefined,
        courseType: req.query.courseType as string | undefined,
        language: req.query.language as string | undefined,
        rating: req.query.rating
          ? parseFloat(req.query.rating as string)
          : undefined,
        sortBy: req.query.sortBy as string | undefined,
        search: req.query.search as string | undefined,
      };

      const courses = await storage.getCourses(options);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Error fetching courses" });
    }
  });

  // Order matters here - specific routes must come before parameterized routes
  app.get("/api/courses/count", async (req: Request, res: Response) => {
    try {
      const options = {
        category: req.query.category as string | undefined,
        subCategory: req.query.subCategory as string | undefined,
        courseType: req.query.courseType as string | undefined,
        language: req.query.language as string | undefined,
        rating: req.query.rating
          ? parseFloat(req.query.rating as string)
          : undefined,
        search: req.query.search as string | undefined,
      };

      const count = await storage.getCoursesCount(options);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Error fetching course count" });
    }
  });

  app.get("/api/courses/:id([0-9]+)", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourse(id);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Error fetching course" });
    }
  });

  // Category filter data routes
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  app.get("/api/subcategories", async (req: Request, res: Response) => {
    try {
      const subCategories = await storage.getSubCategories();
      res.json(subCategories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching subcategories" });
    }
  });

  app.get("/api/course-types", async (req: Request, res: Response) => {
    try {
      const courseTypes = await storage.getCourseTypes();
      res.json(courseTypes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching course types" });
    }
  });

  app.get("/api/languages", async (req: Request, res: Response) => {
    try {
      const languages = await storage.getLanguages();
      res.json(languages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching languages" });
    }
  });

  app.get("/api/skills", async (req: Request, res: Response) => {
    try {
      const skills = await storage.getSkills();
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skills" });
    }
  });

  // CSV Course Upload Routes
  app.post(
    "/api/courses/csv/analyze",
    authenticateJWT,
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        // Check if user is authenticated
        if (!(req as any).user) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        // Check if file was uploaded
        if (!req.file) {
          return res.status(400).json({ message: "No CSV file uploaded" });
        }

        // Verify file type (should be a CSV)
        if (
          req.file.mimetype !== "text/csv" &&
          !req.file.originalname.endsWith(".csv")
        ) {
          return res
            .status(400)
            .json({ message: "File must be a CSV document" });
        }

        // Get course type from the body or query parameters (default to 'online')
        let courseType: "online" | "university" = "online";
        if (
          (req.body && req.body.courseType === "university") ||
          (req.query && req.query.courseType === "university")
        ) {
          courseType = "university";
        }

        // Analyze the CSV file
        const analysis = analyzeCSVFile(req.file.path);

        // If analysis detected a different course type than requested, use that
        if (
          analysis.detectedType !== "unknown" &&
          analysis.detectedType !== courseType
        ) {
          console.log(
            `CSV type auto-detected as ${analysis.detectedType}, overriding requested type ${courseType}`
          );
          courseType = analysis.detectedType;
        }

        // Generate auto-mapping based on the course type
        const autoMapping = generateColumnMapping(analysis.headers, courseType);

        res.json({
          headers: analysis.headers,
          firstRows: analysis.firstRows,
          fileName: req.file.originalname,
          filePath: req.file.path,
          courseType: courseType,
          recordCount: analysis.recordCount,
          autoMapping: autoMapping,
        });
      } catch (error) {
        console.error("Error analyzing CSV file:", error);
        res.status(500).json({
          message: "Error analyzing CSV file",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  app.post(
    "/api/courses/csv/import",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        // Check if user is authenticated
        if (!(req as any).user) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const {
          filePath,
          columnMapping,
          batchSize = 25,
          timeoutSeconds = 90,
        } = req.body;

        // Validate required fields
        if (!filePath) {
          return res.status(400).json({ message: "File path is required" });
        }

        if (!columnMapping || !columnMapping.title || !columnMapping.url) {
          return res.status(400).json({
            message:
              "Column mapping is required with at least 'title' and 'url' fields",
          });
        }

        // Start a timeout to prevent long-running requests
        const timeoutMs = timeoutSeconds * 1000;
        let isTimedOut = false;

        // Handle large files by processing in background
        if (timeoutSeconds > 0) {
          setTimeout(() => {
            isTimedOut = true;
          }, timeoutMs);
        }

        // Check if file is large (try to read first and get number of records)
        let recordCount = 0;
        let isLargeFile = false;

        try {
          if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, {
              encoding: "utf-8",
            });
            const records = parse(fileContent, {
              columns: true,
              skip_empty_lines: true,
            });
            recordCount = records.length;

            // If more than 50 records, consider it a large file that needs background processing
            isLargeFile = recordCount > 50;
          }
        } catch (error) {
          console.error("Error checking file size:", error);
        }

        // For large files, process in background and return immediately
        if (isLargeFile) {
          // Start the import process in background
          console.log(
            `Processing large file with ${recordCount} records in background`
          );

          // Get the user ID for progress tracking
          const userId = (req as any).user.id;

          // Create a new import job
          const jobId = progressTracker.createImportJob(
            userId,
            "online",
            filePath,
            recordCount
          );

          // Start background processing (no await)
          (async () => {
            try {
              // Update job status to processing
              progressTracker.updateImportJobProgress(jobId, 0, "processing");

              // Process the import
              const importResult = await importCoursesFromCSV(
                filePath,
                columnMapping,
                storage,
                "online",
                batchSize,
                userId,
                jobId
              );

              console.log(
                `Background import completed: ${importResult.count} courses imported`
              );

              // Mark job as completed
              progressTracker.updateImportJobProgress(
                jobId,
                importResult.count,
                "completed"
              );
            } catch (error) {
              console.error("Error in background course import:", error);
              const errorMsg =
                error instanceof Error ? error.message : String(error);
              progressTracker.setImportJobError(jobId, errorMsg);
            }
          })();

          // Return a response immediately so the client doesn't time out
          return res.json({
            message: `Processing ${recordCount} courses in the background`,
            importedCount: 0,
            backgroundProcessing: true,
            totalRecords: recordCount,
            jobId: jobId,
          });
        }

        // For smaller files, process synchronously
        const userId = (req as any).user.id;
        const importResult = await importCoursesFromCSV(
          filePath,
          columnMapping,
          storage,
          "online",
          batchSize,
          userId
        );

        // Check if request timed out
        if (isTimedOut) {
          console.log(
            "Request timed out, but import is continuing in the background"
          );
          return;
        }

        // Return the result
        if (!importResult.success) {
          return res.status(400).json({
            message: "Failed to import courses",
            errors: importResult.errors,
          });
        }

        res.json({
          message: `Successfully imported ${importResult.count} courses`,
          importedCount: importResult.count,
          errors:
            importResult.errors.length > 0 ? importResult.errors : undefined,
        });

        // Delete the temporary file after processing
        fs.unlink(filePath, (err) => {
          if (err)
            console.error(`Failed to delete temporary file ${filePath}:`, err);
        });
      } catch (error) {
        console.error("Error importing courses from CSV:", error);
        res.status(500).json({
          message: "Error importing courses",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // University courses CSV import endpoint
  app.post(
    "/api/university-courses/csv/import",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        // Check if user is authenticated
        if (!(req as any).user) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const {
          filePath,
          columnMapping,
          batchSize = 25,
          timeoutSeconds = 90,
        } = req.body;

        // Validate required fields
        if (!filePath) {
          return res.status(400).json({ message: "File path is required" });
        }

        if (!columnMapping || !columnMapping.title || !columnMapping.url) {
          return res.status(400).json({
            message:
              "Column mapping is required with at least 'title' and 'url' fields",
          });
        }

        // Start a timeout to prevent long-running requests
        const timeoutMs = timeoutSeconds * 1000;
        let isTimedOut = false;

        // Handle large files by processing in background
        if (timeoutSeconds > 0) {
          setTimeout(() => {
            isTimedOut = true;
          }, timeoutMs);
        }

        // Check if file is large (try to read first and get number of records)
        let recordCount = 0;
        let isLargeFile = false;

        try {
          if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, {
              encoding: "utf-8",
            });
            const records = parse(fileContent, {
              columns: true,
              skip_empty_lines: true,
            });
            recordCount = records.length;

            // If more than 50 records, consider it a large file that needs background processing
            isLargeFile = recordCount > 50;
          }
        } catch (error) {
          console.error("Error checking file size:", error);
        }

        // For large files, process in background and return immediately
        if (isLargeFile) {
          // Start the import process in background
          console.log(
            `Processing large file with ${recordCount} records in background`
          );

          // Get the user ID for progress tracking
          const userId = (req as any).user.id;

          // Create a new import job
          const jobId = progressTracker.createImportJob(
            userId,
            "university",
            filePath,
            recordCount
          );

          // Start background processing (no await)
          (async () => {
            try {
              // Update job status to processing
              progressTracker.updateImportJobProgress(jobId, 0, "processing");

              // Process the import
              const importResult = await importCoursesFromCSV(
                filePath,
                columnMapping,
                storage,
                "university",
                batchSize,
                userId,
                jobId
              );

              console.log(
                `Background import completed: ${importResult.count} university courses imported`
              );

              // Mark job as completed
              progressTracker.updateImportJobProgress(
                jobId,
                importResult.count,
                "completed"
              );
            } catch (error) {
              console.error(
                "Error in background university course import:",
                error
              );
              const errorMsg =
                error instanceof Error ? error.message : String(error);
              progressTracker.setImportJobError(jobId, errorMsg);
            }
          })();

          // Return a response immediately so the client doesn't time out
          return res.json({
            message: `Processing ${recordCount} university courses in the background`,
            importedCount: 0,
            backgroundProcessing: true,
            totalRecords: recordCount,
            jobId: jobId,
          });
        }

        // For smaller files, process synchronously
        const userId = (req as any).user.id;
        try {
          const importResult = await importCoursesFromCSV(
            filePath,
            columnMapping,
            storage,
            "university",
            batchSize,
            userId
          );

          // Check if request timed out
          if (isTimedOut) {
            console.log(
              "Request timed out, but import is continuing in the background"
            );
            return;
          }

          // Return the result
          if (!importResult.success) {
            return res.status(400).json({
              message: "Failed to import university courses",
              errors: importResult.errors,
              importedCount: importResult.count,
              jobId: importResult.jobId,
            });
          }

          res.json({
            message: `Successfully imported ${importResult.count} university courses`,
            importedCount: importResult.count,
            errors:
              importResult.errors.length > 0 ? importResult.errors : undefined,
            jobId: importResult.jobId,
          });
        } catch (importError) {
          console.error("Error during synchronous CSV import:", importError);

          // If request hasn't timed out yet, return error
          if (!isTimedOut && !res.headersSent) {
            return res.status(500).json({
              message: "Error importing university courses",
              error:
                importError instanceof Error
                  ? importError.message
                  : String(importError),
            });
          }
        }

        // Delete the temporary file after processing
        fs.unlink(filePath, (err) => {
          if (err)
            console.error(`Failed to delete temporary file ${filePath}:`, err);
        });
      } catch (error) {
        console.error("Error importing university courses from CSV:", error);
        res.status(500).json({
          message: "Error importing university courses",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // University courses CSV analyze endpoint
  app.post(
    "/api/university-courses/csv/analyze",
    authenticateJWT,
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        // Check if user is authenticated
        if (!(req as any).user) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        // Check if file was uploaded
        if (!req.file) {
          return res.status(400).json({ message: "No CSV file uploaded" });
        }

        // Verify file type (should be a CSV)
        if (
          req.file.mimetype !== "text/csv" &&
          !req.file.originalname.endsWith(".csv")
        ) {
          return res
            .status(400)
            .json({ message: "File must be a CSV document" });
        }

        // Analyze the CSV file
        const analysis = analyzeCSVFile(req.file.path);

        // Generate auto-mapping based on the university course type
        const autoMapping = generateColumnMapping(
          analysis.headers,
          "university"
        );

        res.json({
          headers: analysis.headers,
          firstRows: analysis.firstRows,
          fileName: req.file.originalname,
          filePath: req.file.path,
          courseType: "university",
          recordCount: analysis.recordCount,
          autoMapping: autoMapping,
        });
      } catch (error) {
        console.error("Error analyzing CSV file:", error);
        res.status(500).json({
          message: "Error analyzing CSV file",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Bookmark routes (protected)
  app.get(
    "/api/bookmarks",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const bookmarks = await storage.getBookmarksByUserId(userId);

        if (bookmarks.length === 0) {
          return res.json([]);
        }

        const courseIds = bookmarks.map((bookmark) => bookmark.courseId);
        const courses = await storage.getCoursesByIds(courseIds);

        res.json(courses);
      } catch (error) {
        res.status(500).json({ message: "Error fetching bookmarks" });
      }
    }
  );

  app.post(
    "/api/bookmarks",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const { courseId } = req.body;

        if (!courseId) {
          return res.status(400).json({ message: "Course ID is required" });
        }

        // Check if course exists
        const course = await storage.getCourse(courseId);
        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }

        // Check if bookmark already exists
        const existingBookmark = await storage.getBookmark(userId, courseId);
        if (existingBookmark) {
          return res.status(409).json({ message: "Bookmark already exists" });
        }

        const bookmarkData = insertBookmarkSchema.parse({
          userId,
          courseId,
          createdAt: new Date().toISOString(),
        });

        const bookmark = await storage.createBookmark(bookmarkData);
        res.status(201).json(bookmark);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        res.status(500).json({ message: "Error creating bookmark" });
      }
    }
  );

  // Import progress tracking endpoints
  app.get(
    "/api/import-progress/:jobId",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const { jobId } = req.params;
        const userId = (req as any).user.id;

        if (!jobId) {
          return res.status(400).json({ message: "Job ID is required" });
        }

        const jobStatus = progressTracker.getImportJobStatus(jobId);

        if (!jobStatus) {
          return res.status(404).json({ message: "Import job not found" });
        }

        // Make sure the job belongs to the authenticated user
        if (jobStatus.userId !== userId) {
          return res
            .status(403)
            .json({ message: "Not authorized to view this import job" });
        }

        res.json(jobStatus);
      } catch (error) {
        console.error("Error fetching import progress:", error);
        res.status(500).json({
          message: "Error fetching import progress",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  app.get(
    "/api/import-progress",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const jobs = progressTracker.getUserImportJobs(userId);

        // Sort by start time, most recent first
        const sortedJobs = [...jobs].sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );

        res.json(sortedJobs);
      } catch (error) {
        console.error("Error fetching import jobs:", error);
        res.status(500).json({
          message: "Error fetching import jobs",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  app.delete(
    "/api/bookmarks/:courseId",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const courseId = parseInt(req.params.courseId);

        // Check if bookmark exists
        const existingBookmark = await storage.getBookmark(userId, courseId);
        if (!existingBookmark) {
          return res.status(404).json({ message: "Bookmark not found" });
        }

        const success = await storage.deleteBookmark(userId, courseId);

        if (success) {
          res.status(204).send();
        } else {
          res.status(500).json({ message: "Failed to delete bookmark" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error deleting bookmark" });
      }
    }
  );

  // User profile route (protected)
  app.get(
    "/api/profile",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Return user data without password
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error) {
        res.status(500).json({ message: "Error fetching profile" });
      }
    }
  );

  // Get user by ID for profile view
  app.get("/api/users/:userId", async (req: Request, res: Response) => {
    try {
      // Handle both numeric and string user IDs (for Firebase auth integration)
      let user;
      const userIdParam = req.params.userId;

      // Try to find user by numeric ID first (if it looks like a number)
      const numericId = parseInt(userIdParam);
      if (!isNaN(numericId)) {
        user = await storage.getUser(numericId);
      }

      // If not found and looks like a Firebase ID, try to find by firebase ID
      if (!user && /^[A-Za-z0-9]{20,}$/.test(userIdParam)) {
        user = await storage.getUserByFirebaseId(userIdParam);
      }

      // If still not found, try to find by username as fallback
      if (!user && userIdParam.length < 20) {
        user = await storage.getUserByUsername(userIdParam);
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Error fetching user data" });
    }
  });

  // Get user's posts
  app.get("/api/users/:userId/posts", async (req: Request, res: Response) => {
    try {
      // Handle both numeric and string user IDs (for Firebase auth integration)
      let user;
      const userIdParam = req.params.userId;

      // Try to find user by numeric ID first (if it looks like a number)
      const numericId = parseInt(userIdParam);
      if (!isNaN(numericId)) {
        user = await storage.getUser(numericId);
      }

      // If not found and looks like a Firebase ID, try to find by firebase ID
      if (!user && /^[A-Za-z0-9]{20,}$/.test(userIdParam)) {
        user = await storage.getUserByFirebaseId(userIdParam);
      }

      // If still not found, try to find by username as fallback
      if (!user && userIdParam.length < 20) {
        user = await storage.getUserByUsername(userIdParam);
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const posts = await storage.getUserPosts(user.id);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Error fetching user posts" });
    }
  });

  app.get("/api/users/:userId/likes", async (req: Request, res: Response) => {
    try {
      // Handle both numeric and string user IDs (for Firebase auth integration)
      let user;
      const userIdParam = req.params.userId;

      // Try to find user by numeric ID first (if it looks like a number)
      const numericId = parseInt(userIdParam);
      if (!isNaN(numericId)) {
        user = await storage.getUser(numericId);
      }

      // If not found and looks like a Firebase ID, try to find by firebase ID
      if (!user && /^[A-Za-z0-9]{20,}$/.test(userIdParam)) {
        user = await storage.getUserByFirebaseId(userIdParam);
      }

      // If still not found, try to find by username as fallback
      if (!user && userIdParam.length < 20) {
        user = await storage.getUserByUsername(userIdParam);
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const likes = await storage.getLearningPostLikesByUserId(user.id);

      // Get the full post details for each liked post
      if (likes.length > 0) {
        const postIds = likes.map((like) => like.postId);
        const posts = await Promise.all(
          postIds.map((postId) => storage.getLearningPost(postId))
        );
        const validPosts = posts.filter(
          (post) => post !== undefined
        ) as LearningPost[];
        return res.json(validPosts);
      }

      res.json([]);
    } catch (error) {
      console.error("Error fetching user likes:", error);
      res.status(500).json({ message: "Error fetching user likes" });
    }
  });

  app.get(
    "/api/users/:userId/comments",
    async (req: Request, res: Response) => {
      try {
        // Handle both numeric and string user IDs (for Firebase auth integration)
        let user;
        const userIdParam = req.params.userId;

        // Try to find user by numeric ID first (if it looks like a number)
        const numericId = parseInt(userIdParam);
        if (!isNaN(numericId)) {
          user = await storage.getUser(numericId);
        }

        // If not found and looks like a Firebase ID, try to find by firebase ID
        if (!user && /^[A-Za-z0-9]{20,}$/.test(userIdParam)) {
          user = await storage.getUserByFirebaseId(userIdParam);
        }

        // If still not found, try to find by username as fallback
        if (!user && userIdParam.length < 20) {
          user = await storage.getUserByUsername(userIdParam);
        }

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const comments = await storage.getLearningPostCommentsByUserId(user.id);

        // Get the full post details for each commented post
        if (comments.length > 0) {
          const postIds = [
            ...new Set(comments.map((comment) => comment.postId)),
          ];
          const posts = await Promise.all(
            postIds.map((postId) => storage.getLearningPost(postId))
          );
          const validPosts = posts.filter(
            (post) => post !== undefined
          ) as LearningPost[];

          // Add the comment content to each post for display
          const postsWithComments = validPosts.map((post) => {
            const postComments = comments.filter(
              (comment) => comment.postId === post.id
            );
            return {
              ...post,
              userComments: postComments,
            };
          });

          return res.json(postsWithComments);
        }

        res.json([]);
      } catch (error) {
        console.error("Error fetching user comments:", error);
        res.status(500).json({ message: "Error fetching user comments" });
      }
    }
  );

  // Get user's followers
  app.get(
    "/api/users/:userId/followers",
    async (req: Request, res: Response) => {
      try {
        // Handle both numeric and string user IDs (for Firebase auth integration)
        let user;
        const userIdParam = req.params.userId;

        // Try to find user by numeric ID first (if it looks like a number)
        const numericId = parseInt(userIdParam);
        if (!isNaN(numericId)) {
          user = await storage.getUser(numericId);
        }

        // If not found and looks like a Firebase ID, try to find by firebase ID
        if (!user && /^[A-Za-z0-9]{20,}$/.test(userIdParam)) {
          user = await storage.getUserByFirebaseId(userIdParam);
        }

        // If still not found, try to find by username as fallback
        if (!user && userIdParam.length < 20) {
          user = await storage.getUserByUsername(userIdParam);
        }

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const followers = await storage.getFollowers(user.id);

        // Remove sensitive data and add mutual follow information
        const safeFollowers = await Promise.all(
          followers.map(async (follower) => {
            const { password, ...safeData } = follower;

            // Check if the user is also following this follower (mutual)
            const isMutual = await storage.isFollowing(user.id, follower.id);

            return {
              ...safeData,
              isFollowingBack: isMutual, // Indicates if it's a mutual follow
            };
          })
        );

        res.json(safeFollowers);
      } catch (error) {
        console.error("Error fetching followers:", error);
        res.status(500).json({ message: "Error fetching followers" });
      }
    }
  );

  // Get user's following
  app.get(
    "/api/users/:userId/following",
    async (req: Request, res: Response) => {
      try {
        // Handle both numeric and string user IDs (for Firebase auth integration)
        let user;
        const userIdParam = req.params.userId;

        // Try to find user by numeric ID first (if it looks like a number)
        const numericId = parseInt(userIdParam);
        if (!isNaN(numericId)) {
          user = await storage.getUser(numericId);
        }

        // If not found and looks like a Firebase ID, try to find by firebase ID
        if (!user && /^[A-Za-z0-9]{20,}$/.test(userIdParam)) {
          user = await storage.getUserByFirebaseId(userIdParam);
        }

        // If still not found, try to find by username as fallback
        if (!user && userIdParam.length < 20) {
          user = await storage.getUserByUsername(userIdParam);
        }

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const following = await storage.getFollowing(user.id);

        // Remove sensitive data and add mutual follow information
        const safeFollowing = await Promise.all(
          following.map(async (followedUser) => {
            const { password, ...safeData } = followedUser;

            // Check if the followed user is also following the current user (mutual)
            const isMutual = await storage.isFollowing(
              followedUser.id,
              user.id
            );

            return {
              ...safeData,
              isFollowingBack: isMutual, // Indicates if it's a mutual follow
            };
          })
        );

        res.json(safeFollowing);
      } catch (error) {
        console.error("Error fetching following:", error);
        res.status(500).json({ message: "Error fetching following" });
      }
    }
  );

  // Get user's followers count
  app.get(
    "/api/users/:userId/followers/count",
    async (req: Request, res: Response) => {
      try {
        // Handle both numeric and string user IDs (for Firebase auth integration)
        let user;
        const userIdParam = req.params.userId;

        // Try to find user by numeric ID first (if it looks like a number)
        const numericId = parseInt(userIdParam);
        if (!isNaN(numericId)) {
          user = await storage.getUser(numericId);
        }

        // If not found and looks like a Firebase ID, try to find by firebase ID
        if (!user && /^[A-Za-z0-9]{20,}$/.test(userIdParam)) {
          user = await storage.getUserByFirebaseId(userIdParam);
        }

        // If still not found, try to find by username as fallback
        if (!user && userIdParam.length < 20) {
          user = await storage.getUserByUsername(userIdParam);
        }

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const count = await storage.getFollowersCount(user.id);
        res.json({ count });
      } catch (error) {
        console.error("Error fetching followers count:", error);
        res.status(500).json({ message: "Error fetching followers count" });
      }
    }
  );

  // Get user's following count
  app.get(
    "/api/users/:userId/following/count",
    async (req: Request, res: Response) => {
      try {
        // Handle both numeric and string user IDs (for Firebase auth integration)
        let user;
        const userIdParam = req.params.userId;

        // Try to find user by numeric ID first (if it looks like a number)
        const numericId = parseInt(userIdParam);
        if (!isNaN(numericId)) {
          user = await storage.getUser(numericId);
        }

        // If not found and looks like a Firebase ID, try to find by firebase ID
        if (!user && /^[A-Za-z0-9]{20,}$/.test(userIdParam)) {
          user = await storage.getUserByFirebaseId(userIdParam);
        }

        // If still not found, try to find by username as fallback
        if (!user && userIdParam.length < 20) {
          user = await storage.getUserByUsername(userIdParam);
        }

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const count = await storage.getFollowingCount(user.id);
        res.json({ count });
      } catch (error) {
        console.error("Error fetching following count:", error);
        res.status(500).json({ message: "Error fetching following count" });
      }
    }
  );

  // Check if current user is following another user - public endpoint with optional auth
  app.get(
    "/api/users/:userId/following/:targetId",
    async (req: Request, res: Response) => {
      try {
        // Get ID from token if available, otherwise use ID from URL param for the check
        let currentUser;
        let targetUser;

        // First, find the target user
        const targetIdParam = req.params.targetId;

        // Try numeric ID first
        const targetNumericId = parseInt(targetIdParam);
        if (!isNaN(targetNumericId)) {
          targetUser = await storage.getUser(targetNumericId);
        }

        // If not found and looks like a Firebase ID, try to find by firebase ID
        if (!targetUser && /^[A-Za-z0-9]{20,}$/.test(targetIdParam)) {
          targetUser = await storage.getUserByFirebaseId(targetIdParam);
        }

        // If still not found, try to find by username as fallback
        if (!targetUser && targetIdParam.length < 20) {
          targetUser = await storage.getUserByUsername(targetIdParam);
        }

        if (!targetUser) {
          return res.status(404).json({ message: "Target user not found" });
        }

        // Now find the user being followed
        const userIdParam = req.params.userId;

        // Try numeric ID first
        const userNumericId = parseInt(userIdParam);
        if (!isNaN(userNumericId)) {
          currentUser = await storage.getUser(userNumericId);
        }

        // If not found and looks like a Firebase ID, try to find by firebase ID
        if (!currentUser && /^[A-Za-z0-9]{20,}$/.test(userIdParam)) {
          currentUser = await storage.getUserByFirebaseId(userIdParam);
        }

        // If still not found, try to find by username as fallback
        if (!currentUser && userIdParam.length < 20) {
          currentUser = await storage.getUserByUsername(userIdParam);
        }

        if (!currentUser) {
          return res.status(404).json({ message: "User not found" });
        }

        const isFollowing = await storage.isFollowing(
          targetUser.id,
          currentUser.id
        );
        res.json({ following: isFollowing });
      } catch (error) {
        console.error("Error checking follow status:", error);
        res.status(500).json({ message: "Error checking follow status" });
      }
    }
  );

  // Follow a user
  app.post(
    "/api/users/:userId/follow",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const followerId = (req as any).user.id;

        // Find the user to follow by ID, Firebase ID, or username
        let userToFollow;
        const userIdParam = req.params.userId;

        // Try numeric ID first
        const numericId = parseInt(userIdParam);
        if (!isNaN(numericId)) {
          userToFollow = await storage.getUser(numericId);
        }

        // If not found and looks like a Firebase ID, try to find by firebase ID
        if (!userToFollow && /^[A-Za-z0-9]{20,}$/.test(userIdParam)) {
          userToFollow = await storage.getUserByFirebaseId(userIdParam);
        }

        // If still not found, try to find by username as fallback
        if (!userToFollow && userIdParam.length < 20) {
          userToFollow = await storage.getUserByUsername(userIdParam);
        }

        if (!userToFollow) {
          return res.status(404).json({ message: "User to follow not found" });
        }

        const followingId = userToFollow.id;

        if (followerId === followingId) {
          return res
            .status(400)
            .json({ message: "You cannot follow yourself" });
        }

        const follow = await storage.createFollow({
          followerId,
          followingId,
        });

        res.status(201).json(follow);
      } catch (error) {
        console.error("Error following user:", error);
        if (
          error instanceof Error &&
          error.message === "Already following this user"
        ) {
          return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Error following user" });
      }
    }
  );

  // Unfollow a user
  app.delete(
    "/api/users/:userId/follow",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const followerId = (req as any).user.id;

        // Find the user to unfollow by ID, Firebase ID, or username
        let userToUnfollow;
        const userIdParam = req.params.userId;

        // Try numeric ID first
        const numericId = parseInt(userIdParam);
        if (!isNaN(numericId)) {
          userToUnfollow = await storage.getUser(numericId);
        }

        // If not found and looks like a Firebase ID, try to find by firebase ID
        if (!userToUnfollow && /^[A-Za-z0-9]{20,}$/.test(userIdParam)) {
          userToUnfollow = await storage.getUserByFirebaseId(userIdParam);
        }

        // If still not found, try to find by username as fallback
        if (!userToUnfollow && userIdParam.length < 20) {
          userToUnfollow = await storage.getUserByUsername(userIdParam);
        }

        if (!userToUnfollow) {
          return res
            .status(404)
            .json({ message: "User to unfollow not found" });
        }

        const followingId = userToUnfollow.id;

        const result = await storage.deleteFollow(followerId, followingId);

        if (!result) {
          return res
            .status(404)
            .json({ message: "Follow relationship not found" });
        }

        res.status(200).json({ success: true });
      } catch (error) {
        console.error("Error unfollowing user:", error);
        res.status(500).json({ message: "Error unfollowing user" });
      }
    }
  );

  // Search history routes (protected)
  app.post(
    "/api/search-history",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const { searchQuery } = req.body;

        if (!searchQuery) {
          return res.status(400).json({ message: "Search query is required" });
        }

        const searchHistoryData = {
          userId,
          searchQuery,
          createdAt: new Date().toISOString(),
        };

        const searchHistory = await storage.createSearchHistory(
          searchHistoryData
        );
        res.status(201).json(searchHistory);
      } catch (error) {
        res.status(500).json({ message: "Error saving search history" });
      }
    }
  );

  app.get(
    "/api/search-history",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const searchHistory = await storage.getSearchHistoryByUserId(userId);
        res.json(searchHistory);
      } catch (error) {
        res.status(500).json({ message: "Error fetching search history" });
      }
    }
  );

  // Comment routes
  app.get(
    "/api/courses/:courseId/comments",
    async (req: Request, res: Response) => {
      try {
        const courseId = parseInt(req.params.courseId);
        if (isNaN(courseId)) {
          return res.status(400).json({ message: "Invalid course ID" });
        }

        // Check if the course exists
        const course = await storage.getCourse(courseId);
        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }

        const comments = await storage.getCommentsByCourseId(courseId);

        // For each comment, get the user data but remove sensitive information
        const commentsWithUserData = await Promise.all(
          comments.map(async (comment) => {
            const user = await storage.getUser(comment.userId);
            if (!user) {
              return {
                ...comment,
                user: { username: "Unknown User" },
              };
            }

            const { password, ...userWithoutPassword } = user;
            return {
              ...comment,
              user: userWithoutPassword,
            };
          })
        );

        res.json(commentsWithUserData);
      } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ message: "Error fetching comments" });
      }
    }
  );

  app.post(
    "/api/courses/:courseId/comments",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const courseId = parseInt(req.params.courseId);

        if (isNaN(courseId)) {
          return res.status(400).json({ message: "Invalid course ID" });
        }

        // Validate input
        const { content, rating } = req.body;
        if (!content) {
          return res
            .status(400)
            .json({ message: "Comment content is required" });
        }

        // Check if the course exists
        const course = await storage.getCourse(courseId);
        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }

        // Create comment
        const commentData = insertCommentSchema.parse({
          userId,
          courseId,
          content,
          rating: rating || null,
          createdAt: new Date().toISOString(),
        });

        const comment = await storage.createComment(commentData);

        // Get user data
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(500).json({ message: "User not found" });
        }

        // Return comment with user data
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({
          ...comment,
          user: userWithoutPassword,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating comment:", error);
        res.status(500).json({ message: "Error creating comment" });
      }
    }
  );

  app.put(
    "/api/comments/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const commentId = parseInt(req.params.id);

        if (isNaN(commentId)) {
          return res.status(400).json({ message: "Invalid comment ID" });
        }

        // Validate input
        const { content, rating } = req.body;
        if (!content) {
          return res
            .status(400)
            .json({ message: "Comment content is required" });
        }

        // Check if the comment exists and belongs to the user
        const comment = await storage.getCommentById(commentId);
        if (!comment) {
          return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.userId !== userId) {
          return res.status(403).json({
            message: "You don't have permission to update this comment",
          });
        }

        // Update comment
        const updatedComment = await storage.updateComment(
          commentId,
          content,
          rating
        );
        if (!updatedComment) {
          return res.status(500).json({ message: "Failed to update comment" });
        }

        // Get user data
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(500).json({ message: "User not found" });
        }

        // Return updated comment with user data
        const { password, ...userWithoutPassword } = user;
        res.json({
          ...updatedComment,
          user: userWithoutPassword,
        });
      } catch (error) {
        console.error("Error updating comment:", error);
        res.status(500).json({ message: "Error updating comment" });
      }
    }
  );

  app.delete(
    "/api/comments/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const commentId = parseInt(req.params.id);

        if (isNaN(commentId)) {
          return res.status(400).json({ message: "Invalid comment ID" });
        }

        // Attempt to delete the comment
        const success = await storage.deleteComment(commentId, userId);

        if (success) {
          return res.status(204).send();
        } else {
          return res.status(404).json({
            message:
              "Comment not found or you don't have permission to delete it",
          });
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Error deleting comment" });
      }
    }
  );

  // Learning Post Routes
  // Get all learning posts with optional filtering
  app.get("/api/learning-posts", async (req: Request, res: Response) => {
    try {
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        type: req.query.type as string | undefined,
        tag: req.query.tag as string | undefined,
        userId: req.query.userId
          ? parseInt(req.query.userId as string)
          : undefined,
      };

      const posts = await storage.getLearningPosts(options);

      // Get user data for each post
      const postsWithUsers = await Promise.all(
        posts.map(async (post) => {
          const user = await storage.getUser(post.userId);
          if (!user) return { ...post, user: null };

          const { password, ...userWithoutPassword } = user;
          return { ...post, user: userWithoutPassword };
        })
      );

      res.json(postsWithUsers);
    } catch (error) {
      console.error("Error fetching learning posts:", error);
      res.status(500).json({ message: "Error fetching learning posts" });
    }
  });

  // Get a single learning post by ID
  app.get("/api/learning-posts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }

      const post = await storage.getLearningPost(id);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Increment view count asynchronously
      // We don't need to wait for this to complete before sending the response
      storage.incrementLearningPostViews(id).catch((err) => {
        console.error("Error incrementing view count:", err);
      });

      // Get user data
      const user = await storage.getUser(post.userId);
      if (!user) {
        return res.status(500).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;

      res.json({
        ...post,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Error fetching learning post:", error);
      res.status(500).json({ message: "Error fetching learning post" });
    }
  });

  // Create a new learning post
  app.post(
    "/api/learning-posts",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;

        const postData = insertLearningPostSchema.parse({
          ...req.body,
          userId,
        });

        const newPost = await storage.createLearningPost(postData);

        // Get user data
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(500).json({ message: "User not found" });
        }

        const { password, ...userWithoutPassword } = user;

        res.status(201).json({
          ...newPost,
          user: userWithoutPassword,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating learning post:", error);
        res.status(500).json({ message: "Error creating learning post" });
      }
    }
  );

  // Update a learning post
  app.put(
    "/api/learning-posts/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const postId = parseInt(req.params.id);

        if (isNaN(postId)) {
          return res.status(400).json({ message: "Invalid post ID" });
        }

        // Check if post exists and belongs to user
        const existingPost = await storage.getLearningPost(postId);

        if (!existingPost) {
          return res.status(404).json({ message: "Post not found" });
        }

        if (existingPost.userId !== userId) {
          return res
            .status(403)
            .json({ message: "You don't have permission to update this post" });
        }

        // Update post
        const postData = {
          ...req.body,
        };

        const updatedPost = await storage.updateLearningPost(postId, postData);

        if (!updatedPost) {
          return res.status(500).json({ message: "Failed to update post" });
        }

        // Get user data
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(500).json({ message: "User not found" });
        }

        const { password, ...userWithoutPassword } = user;

        res.json({
          ...updatedPost,
          user: userWithoutPassword,
        });
      } catch (error) {
        console.error("Error updating learning post:", error);
        res.status(500).json({ message: "Error updating learning post" });
      }
    }
  );

  // Delete a learning post
  app.delete(
    "/api/learning-posts/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const postId = parseInt(req.params.id);

        if (isNaN(postId)) {
          return res.status(400).json({ message: "Invalid post ID" });
        }

        // Attempt to delete the post
        const success = await storage.deleteLearningPost(postId, userId);

        if (success) {
          return res.status(204).send();
        } else {
          return res.status(404).json({
            message: "Post not found or you don't have permission to delete it",
          });
        }
      } catch (error) {
        console.error("Error deleting learning post:", error);
        res.status(500).json({ message: "Error deleting learning post" });
      }
    }
  );

  // Get all learning post tags
  app.get("/api/learning-post-tags", async (req: Request, res: Response) => {
    try {
      const tags = await storage.getLearningPostTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching learning post tags:", error);
      res.status(500).json({ message: "Error fetching learning post tags" });
    }
  });

  // Learning Post Comment Routes
  // Get comments for a learning post
  app.get(
    "/api/learning-posts/:postId/comments",
    async (req: Request, res: Response) => {
      try {
        const postId = parseInt(req.params.postId);

        if (isNaN(postId)) {
          return res.status(400).json({ message: "Invalid post ID" });
        }

        const comments = await storage.getLearningPostCommentsByPostId(postId);

        // Get user data for each comment
        const commentsWithUsers = await Promise.all(
          comments.map(async (comment) => {
            const user = await storage.getUser(comment.userId);
            if (!user) return { ...comment, user: null };

            const { password, ...userWithoutPassword } = user;
            return { ...comment, user: userWithoutPassword };
          })
        );

        res.json(commentsWithUsers);
      } catch (error) {
        console.error("Error fetching learning post comments:", error);
        res
          .status(500)
          .json({ message: "Error fetching learning post comments" });
      }
    }
  );

  // Get comment count for a learning post
  app.get(
    "/api/learning-posts/:postId/comments/count",
    async (req: Request, res: Response) => {
      try {
        const postId = parseInt(req.params.postId);

        if (isNaN(postId)) {
          return res.status(400).json({ message: "Invalid post ID" });
        }

        const count = await storage.getLearningPostCommentsCount(postId);
        res.json({ count });
      } catch (error) {
        console.error("Error fetching learning post comment count:", error);
        res
          .status(500)
          .json({ message: "Error fetching learning post comment count" });
      }
    }
  );

  // Create a comment on a learning post
  app.post(
    "/api/learning-posts/:postId/comments",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const postId = parseInt(req.params.postId);

        if (isNaN(postId)) {
          return res.status(400).json({ message: "Invalid post ID" });
        }

        // Check if post exists
        const post = await storage.getLearningPost(postId);
        if (!post) {
          return res.status(404).json({ message: "Post not found" });
        }

        const { content } = req.body;

        if (!content) {
          return res
            .status(400)
            .json({ message: "Comment content is required" });
        }

        const commentData = insertLearningPostCommentSchema.parse({
          postId,
          userId,
          content,
        });

        const newComment = await storage.createLearningPostComment(commentData);

        // Get user data
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(500).json({ message: "User not found" });
        }

        const { password, ...userWithoutPassword } = user;

        res.status(201).json({
          ...newComment,
          user: userWithoutPassword,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating learning post comment:", error);
        res
          .status(500)
          .json({ message: "Error creating learning post comment" });
      }
    }
  );

  // Update a learning post comment
  app.put(
    "/api/learning-post-comments/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const commentId = parseInt(req.params.id);

        if (isNaN(commentId)) {
          return res.status(400).json({ message: "Invalid comment ID" });
        }

        // Check if comment exists and belongs to user
        const existingComment = await storage.getLearningPostComment(commentId);

        if (!existingComment) {
          return res.status(404).json({ message: "Comment not found" });
        }

        if (existingComment.userId !== userId) {
          return res.status(403).json({
            message: "You don't have permission to update this comment",
          });
        }

        const { content } = req.body;

        if (!content) {
          return res
            .status(400)
            .json({ message: "Comment content is required" });
        }

        // Update comment
        const updatedComment = await storage.updateLearningPostComment(
          commentId,
          content
        );

        if (!updatedComment) {
          return res.status(500).json({ message: "Failed to update comment" });
        }

        // Get user data
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(500).json({ message: "User not found" });
        }

        const { password, ...userWithoutPassword } = user;

        res.json({
          ...updatedComment,
          user: userWithoutPassword,
        });
      } catch (error) {
        console.error("Error updating learning post comment:", error);
        res
          .status(500)
          .json({ message: "Error updating learning post comment" });
      }
    }
  );

  // Delete a learning post comment
  app.delete(
    "/api/learning-post-comments/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const commentId = parseInt(req.params.id);

        if (isNaN(commentId)) {
          return res.status(400).json({ message: "Invalid comment ID" });
        }

        // Attempt to delete the comment
        const success = await storage.deleteLearningPostComment(
          commentId,
          userId
        );

        if (success) {
          return res.status(204).send();
        } else {
          return res.status(404).json({
            message:
              "Comment not found or you don't have permission to delete it",
          });
        }
      } catch (error) {
        console.error("Error deleting learning post comment:", error);
        res
          .status(500)
          .json({ message: "Error deleting learning post comment" });
      }
    }
  );

  // Learning Post Like Routes
  // Like a learning post
  app.post(
    "/api/learning-posts/:postId/like",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const postId = parseInt(req.params.postId);

        if (isNaN(postId)) {
          return res.status(400).json({ message: "Invalid post ID" });
        }

        // Check if post exists
        const post = await storage.getLearningPost(postId);
        if (!post) {
          return res.status(404).json({ message: "Post not found" });
        }

        // Check if already liked
        const existingLike = await storage.getLearningPostLike(postId, userId);
        if (existingLike) {
          return res
            .status(409)
            .json({ message: "You have already liked this post" });
        }

        const likeData = insertLearningPostLikeSchema.parse({
          postId,
          userId,
        });

        await storage.createLearningPostLike(likeData);

        // Get updated like count
        const likeCount = await storage.getLearningPostLikesCount(postId);

        res.status(201).json({ liked: true, count: likeCount });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error liking learning post:", error);
        res.status(500).json({ message: "Error liking learning post" });
      }
    }
  );

  // Unlike a learning post
  app.delete(
    "/api/learning-posts/:postId/like",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const postId = parseInt(req.params.postId);

        if (isNaN(postId)) {
          return res.status(400).json({ message: "Invalid post ID" });
        }

        // Check if like exists
        const existingLike = await storage.getLearningPostLike(postId, userId);
        if (!existingLike) {
          return res
            .status(404)
            .json({ message: "You have not liked this post" });
        }

        // Remove like
        await storage.deleteLearningPostLike(postId, userId);

        // Get updated like count
        const likeCount = await storage.getLearningPostLikesCount(postId);

        res.json({ liked: false, count: likeCount });
      } catch (error) {
        console.error("Error unliking learning post:", error);
        res.status(500).json({ message: "Error unliking learning post" });
      }
    }
  );

  // Check if user has liked a post and get like count
  app.get(
    "/api/learning-posts/:postId/like",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const postId = parseInt(req.params.postId);

        if (isNaN(postId)) {
          return res.status(400).json({ message: "Invalid post ID" });
        }

        // Check if post exists
        const post = await storage.getLearningPost(postId);
        if (!post) {
          return res.status(404).json({ message: "Post not found" });
        }

        // Check if user has liked the post
        const like = await storage.getLearningPostLike(postId, userId);

        // Get total likes count
        const likeCount = await storage.getLearningPostLikesCount(postId);

        res.json({
          liked: !!like,
          count: likeCount,
        });
      } catch (error) {
        console.error("Error checking like status:", error);
        res.status(500).json({ message: "Error checking like status" });
      }
    }
  );

  // Get likes count for a post - doesn't require authentication
  app.get(
    "/api/learning-posts/:postId/like/count",
    async (req: Request, res: Response) => {
      try {
        const postId = parseInt(req.params.postId);

        if (isNaN(postId)) {
          return res.status(400).json({ message: "Invalid post ID" });
        }

        // Check if post exists
        const post = await storage.getLearningPost(postId);
        if (!post) {
          return res.status(404).json({ message: "Post not found" });
        }

        // Get total likes count
        const likeCount = await storage.getLearningPostLikesCount(postId);

        res.json({
          count: likeCount,
        });
      } catch (error) {
        console.error("Error getting like count:", error);
        res.status(500).json({ message: "Error getting like count" });
      }
    }
  );

  // Learning Post Bookmark Routes
  // Get user's bookmarked learning posts
  app.get(
    "/api/learning-post-bookmarks",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;

        const bookmarks = await storage.getLearningPostBookmarksByUserId(
          userId
        );

        if (bookmarks.length === 0) {
          return res.json([]);
        }

        // Get posts for all bookmarks
        const postPromises = bookmarks.map((bookmark) =>
          storage.getLearningPost(bookmark.postId)
        );

        const posts = await Promise.all(postPromises);
        const validPosts = posts.filter(
          (post) => post !== undefined
        ) as typeof posts;

        // Get user data for each post
        const postsWithUsers = await Promise.all(
          validPosts.map(async (post) => {
            const user = await storage.getUser(post!.userId);
            if (!user) return { ...post, user: null };

            const { password, ...userWithoutPassword } = user;
            return { ...post, user: userWithoutPassword };
          })
        );

        res.json(postsWithUsers);
      } catch (error) {
        console.error("Error fetching learning post bookmarks:", error);
        res
          .status(500)
          .json({ message: "Error fetching learning post bookmarks" });
      }
    }
  );

  // Bookmark a learning post
  app.post(
    "/api/learning-posts/:postId/bookmark",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const postId = parseInt(req.params.postId);

        if (isNaN(postId)) {
          return res.status(400).json({ message: "Invalid post ID" });
        }

        // Check if post exists
        const post = await storage.getLearningPost(postId);
        if (!post) {
          return res.status(404).json({ message: "Post not found" });
        }

        // Check if already bookmarked
        const existingBookmark = await storage.getLearningPostBookmark(
          postId,
          userId
        );
        if (existingBookmark) {
          return res
            .status(409)
            .json({ message: "You have already bookmarked this post" });
        }

        const bookmarkData = insertLearningPostBookmarkSchema.parse({
          postId,
          userId,
        });

        const bookmark = await storage.createLearningPostBookmark(bookmarkData);

        res.status(201).json({ bookmarked: true, bookmark });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error bookmarking learning post:", error);
        res.status(500).json({ message: "Error bookmarking learning post" });
      }
    }
  );

  // Remove a bookmark from a learning post
  app.delete(
    "/api/learning-posts/:postId/bookmark",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const postId = parseInt(req.params.postId);

        if (isNaN(postId)) {
          return res.status(400).json({ message: "Invalid post ID" });
        }

        // Check if bookmark exists
        const existingBookmark = await storage.getLearningPostBookmark(
          postId,
          userId
        );
        if (!existingBookmark) {
          return res
            .status(404)
            .json({ message: "You have not bookmarked this post" });
        }

        // Remove bookmark
        await storage.deleteLearningPostBookmark(postId, userId);

        res.json({ bookmarked: false });
      } catch (error) {
        console.error("Error removing learning post bookmark:", error);
        res
          .status(500)
          .json({ message: "Error removing learning post bookmark" });
      }
    }
  );

  // Check if user has bookmarked a post
  app.get(
    "/api/learning-posts/:postId/bookmark",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const postId = parseInt(req.params.postId);

        if (isNaN(postId)) {
          return res.status(400).json({ message: "Invalid post ID" });
        }

        // Check if post exists
        const post = await storage.getLearningPost(postId);
        if (!post) {
          return res.status(404).json({ message: "Post not found" });
        }

        // Check if user has bookmarked the post
        const bookmark = await storage.getLearningPostBookmark(postId, userId);

        res.json({
          bookmarked: !!bookmark,
        });
      } catch (error) {
        console.error("Error checking bookmark status:", error);
        res.status(500).json({ message: "Error checking bookmark status" });
      }
    }
  );

  // AI Assistant Chat API
  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    try {
      console.log("AI Chat API Request received:", {
        provider: req.body.provider,
        modelRequested: req.body.model,
        messageCount: req.body?.messages?.length,
      });

      // Pass request to the AI service handler
      await handleChatRequest(req, res);
    } catch (error) {
      console.error("AI Chat API Error:", error);
      // If response was not already sent by the handler
      if (!res.headersSent) {
        res.status(500).json({
          error: "An error occurred processing your AI request",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    }
  });

  // AI Conversation Management Routes (protected)

  // Get user's saved conversations
  app.get(
    "/api/ai/conversations",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const conversations = await storage.getAiConversationsByUserId(userId);
        res.json(conversations);
      } catch (error) {
        console.error("Error fetching AI conversations:", error);
        res.status(500).json({
          message: "Error fetching AI conversations",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Save a conversation
  app.post(
    "/api/ai/conversations",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;

        // Handle optional contextData, pageUrl and pageTitle
        const conversationData = insertAiConversationSchema.parse({
          ...req.body,
          userId,
          messages: JSON.stringify(req.body.messages || []),
          contextData: req.body.contextData || null,
          pageUrl: req.body.pageUrl || null,
          pageTitle: req.body.pageTitle || null,
        });

        console.log("Creating AI conversation with context:", {
          hasContextData: !!conversationData.contextData,
          pageUrl: conversationData.pageUrl,
          pageTitle: conversationData.pageTitle,
        });

        const conversation = await storage.createAiConversation(
          conversationData
        );
        res.status(201).json(conversation);
      } catch (error) {
        console.error("Error saving AI conversation:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Invalid conversation data",
            details: fromZodError(error).message,
          });
        }
        res.status(500).json({
          message: "Error saving AI conversation",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Update a conversation
  app.put(
    "/api/ai/conversations/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const conversationId = parseInt(req.params.id);

        // Check if conversation exists and belongs to user
        const existingConversation = await storage.getAiConversation(
          conversationId
        );
        if (!existingConversation) {
          return res.status(404).json({ message: "Conversation not found" });
        }

        if (existingConversation.userId !== userId) {
          return res.status(403).json({
            message: "You don't have permission to update this conversation",
          });
        }

        // Convert messages to string if provided
        const updateData = {
          ...req.body,
        };

        if (req.body.messages) {
          updateData.messages = JSON.stringify(req.body.messages);
        }

        const updatedConversation = await storage.updateAiConversation(
          conversationId,
          updateData
        );
        res.json(updatedConversation);
      } catch (error) {
        console.error("Error updating AI conversation:", error);
        res.status(500).json({
          message: "Error updating AI conversation",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Delete a conversation
  app.delete(
    "/api/ai/conversations/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const conversationId = parseInt(req.params.id);

        const success = await storage.deleteAiConversation(
          conversationId,
          userId
        );

        if (success) {
          res.status(204).send();
        } else {
          res
            .status(404)
            .json({ message: "Conversation not found or already deleted" });
        }
      } catch (error) {
        console.error("Error deleting AI conversation:", error);
        res.status(500).json({
          message: "Error deleting AI conversation",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Method Applications Endpoints

  // Check if a user has applied a method
  app.get(
    "/api/methods/:methodId/application",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const methodId = parseInt(req.params.methodId);

        const application = await storage.getMethodApplicationByUserAndMethod(
          userId,
          methodId
        );

        res.json({
          applied: !!application,
          application: application || null,
        });
      } catch (error) {
        console.error("Error checking method application:", error);
        res.status(500).json({
          message: "Failed to check method application",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Apply a method (create a method application)
  app.post(
    "/api/methods/:methodId/apply",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const methodId = parseInt(req.params.methodId);

        // Check if method post exists and is a method type
        const methodPost = await storage.getLearningPost(methodId);

        if (!methodPost) {
          return res.status(404).json({ message: "Method not found" });
        }

        if (methodPost.type !== "method") {
          return res.status(400).json({ message: "This post is not a method" });
        }

        // Check if user already applied this method
        const existingApplication =
          await storage.getMethodApplicationByUserAndMethod(userId, methodId);

        if (existingApplication) {
          return res
            .status(400)
            .json({ message: "You have already applied this method" });
        }

        // Create new application
        const applicationData = insertMethodApplicationSchema.parse({
          methodPostId: methodId,
          userId,
          status: "active",
          startDate: new Date(),
          progress: req.body.progress || "{}",
        });

        const newApplication = await storage.createMethodApplication(
          applicationData
        );

        res.status(201).json(newApplication);
      } catch (error) {
        console.error("Error applying method:", error);
        res.status(500).json({
          message: "Failed to apply method",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Get all method applications for a user
  app.get(
    "/api/methods/applications",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const applications = await storage.getMethodApplicationsByUserId(
          userId
        );

        // For each application, get the related method post
        const applicationsWithMethodData = await Promise.all(
          applications.map(async (app) => {
            const methodPost = await storage.getLearningPost(app.methodPostId);
            return {
              ...app,
              methodPost: methodPost || null,
            };
          })
        );

        res.json(applicationsWithMethodData);
      } catch (error) {
        console.error("Error fetching method applications:", error);
        res.status(500).json({
          message: "Failed to fetch method applications",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Get active method applications for a user
  app.get(
    "/api/methods/applications/active",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const applications = await storage.getActiveMethodApplicationsByUserId(
          userId
        );

        // For each application, get the related method post
        const applicationsWithMethodData = await Promise.all(
          applications.map(async (app) => {
            const methodPost = await storage.getLearningPost(app.methodPostId);
            return {
              ...app,
              methodPost: methodPost || null,
            };
          })
        );

        res.json(applicationsWithMethodData);
      } catch (error) {
        console.error("Error fetching active method applications:", error);
        res.status(500).json({
          message: "Failed to fetch active method applications",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Update method application status and add user feedback
  app.put(
    "/api/methods/applications/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const applicationId = parseInt(req.params.id);

        const application = await storage.getMethodApplication(applicationId);

        if (!application) {
          return res
            .status(404)
            .json({ message: "Method application not found" });
        }

        if (application.userId !== userId) {
          return res.status(403).json({
            message: "You don't have permission to update this application",
          });
        }

        const { status, feedback, rating, progress, endDate } = req.body;

        const updateData: any = {
          updatedAt: new Date(),
        };

        if (status) updateData.status = status;
        if (feedback) updateData.feedback = feedback;
        if (rating) updateData.rating = rating;
        if (progress) updateData.progress = progress;

        // If status is completed and no endDate is provided, set it to now
        if (status === "completed" && !endDate) {
          updateData.endDate = new Date();
        } else if (endDate) {
          updateData.endDate = new Date(endDate);
        }

        const updatedApplication = await storage.updateMethodApplication(
          applicationId,
          updateData
        );

        res.json(updatedApplication);
      } catch (error) {
        console.error("Error updating method application:", error);
        res.status(500).json({
          message: "Failed to update method application",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Delete a method application
  app.delete(
    "/api/methods/applications/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const applicationId = parseInt(req.params.id);

        const application = await storage.getMethodApplication(applicationId);

        if (!application) {
          return res
            .status(404)
            .json({ message: "Method application not found" });
        }

        if (application.userId !== userId) {
          return res.status(403).json({
            message: "You don't have permission to delete this application",
          });
        }

        const success = await storage.deleteMethodApplication(
          applicationId,
          userId
        );

        if (success) {
          res.status(204).send();
        } else {
          res.status(404).json({
            message: "Method application not found or already deleted",
          });
        }
      } catch (error) {
        console.error("Error deleting method application:", error);
        res.status(500).json({
          message: "Failed to delete method application",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Get method application count for a method
  app.get(
    "/api/methods/:methodId/applications/count",
    async (req: Request, res: Response) => {
      try {
        const methodId = parseInt(req.params.methodId);
        const count = await storage.getMethodApplicationsCount(methodId);

        res.json({ count });
      } catch (error) {
        console.error("Error getting method application count:", error);
        res.status(500).json({
          message: "Failed to get method application count",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // User Gamification endpoints
  app.get(
    "/api/user/gamification",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;

        // Get user gamification data
        let gamification = await storage.getUserGamification(userId);

        // If no gamification data exists yet, create a default record
        if (!gamification) {
          gamification = await storage.createUserGamification({
            userId,
            level: 1,
            points: 0,
            streak: 0,
          });
        }

        // Get badges
        const badges = await storage.getUserBadges(userId);

        // Calculate points needed for next level
        const nextLevelPoints = gamification.level * 100;

        res.json({
          ...gamification,
          nextLevelPoints,
          badges,
        });
      } catch (error) {
        console.error("Error fetching gamification data:", error);
        res.status(500).json({ message: "Error fetching gamification data" });
      }
    }
  );

  // User recommendations endpoints
  app.get(
    "/api/recommendations",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const limit = req.query.limit ? Number(req.query.limit) : 5;
        const offset = req.query.offset ? Number(req.query.offset) : 0;
        // Generate recommendations if they don't exist yet
        const recommendations = await storage.generateRecommendations(userId, limit, offset);
        // Format for frontend
        const formattedRecommendations = recommendations.map((rec) => ({
          id: rec.course.id,
          title: rec.course.title,
          shortIntro: rec.course.shortIntro,
          category: rec.course.category,
          trending: rec.trending,
          reason: rec.reason,
        }));
        res.json(formattedRecommendations);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        res.status(500).json({ message: "Error fetching recommendations" });
      }
    }
  );

  // Anonymous recommendations (for non-authenticated users)
  app.get(
    "/api/recommendations/anonymous",
    async (req: Request, res: Response) => {
      try {
        // Get top rated courses as recommendations for anonymous users
        const topCourses = await storage.getCourses({
          limit: 5,
          sortBy: "rating_high",
        });

        // Format for frontend
        const anonymousRecommendations = topCourses.map((course) => ({
          id: course.id,
          title: course.title,
          shortIntro: course.shortIntro,
          category: course.category,
          trending: course.numberOfViewers > 50000,
          reason: "Highly rated course you might enjoy",
        }));

        res.json(anonymousRecommendations);
      } catch (error) {
        console.error("Error fetching anonymous recommendations:", error);
        res.status(500).json({ message: "Error fetching recommendations" });
      }
    }
  );

  // Increment streak endpoint
  app.post(
    "/api/user/streak",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const updatedGamification = await storage.incrementUserStreak(userId);

        // Calculate points needed for next level
        const nextLevelPoints = updatedGamification.level * 100;

        res.json({
          ...updatedGamification,
          nextLevelPoints,
        });
      } catch (error) {
        console.error("Error updating streak:", error);
        res.status(500).json({ message: "Error updating streak" });
      }
    }
  );

  // Add points endpoint
  app.post(
    "/api/user/points",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const { points } = req.body;

        if (!points || typeof points !== "number") {
          return res.status(400).json({ message: "Invalid points value" });
        }

        const updatedGamification = await storage.addUserPoints(userId, points);

        // Calculate points needed for next level
        const nextLevelPoints = updatedGamification.level * 100;

        res.json({
          ...updatedGamification,
          nextLevelPoints,
        });
      } catch (error) {
        console.error("Error adding points:", error);
        res.status(500).json({ message: "Error adding points" });
      }
    }
  );

  // User Events Routes
  app.get(
    "/api/events",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const { startDate, endDate, limit, upcoming, eventType } = req.query;

        const options: {
          startDate?: Date;
          endDate?: Date;
          limit?: number;
          upcoming?: boolean;
          eventType?: string;
        } = {};

        if (startDate) {
          options.startDate = new Date(startDate as string);
        }

        if (endDate) {
          options.endDate = new Date(endDate as string);
        }

        if (limit && !isNaN(Number(limit))) {
          options.limit = Number(limit);
        }

        if (upcoming === "true") {
          options.upcoming = true;
        }

        if (eventType && typeof eventType === "string") {
          options.eventType = eventType;
        }

        const events = await storage.getUserEvents(userId, options);

        // If associated with courses, fetch course data
        const eventsWithDetails = await Promise.all(
          events.map(async (event) => {
            if (event.relatedCourseId) {
              const course = await storage.getCourse(event.relatedCourseId);
              return {
                ...event,
                course: course || null,
              };
            }
            return event;
          })
        );

        res.json(eventsWithDetails);
      } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ message: "Error fetching events" });
      }
    }
  );

  app.get(
    "/api/events/upcoming",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const { limit } = req.query;

        let limitNum = 5; // Default limit
        if (limit && !isNaN(Number(limit))) {
          limitNum = Number(limit);
        }

        const events = await storage.getUpcomingEvents(userId, limitNum);

        // If associated with courses, fetch course data
        const eventsWithDetails = await Promise.all(
          events.map(async (event) => {
            if (event.relatedCourseId) {
              const course = await storage.getCourse(event.relatedCourseId);
              return {
                ...event,
                course: course || null,
              };
            }
            return event;
          })
        );

        res.json(eventsWithDetails);
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
        res.status(500).json({ message: "Error fetching upcoming events" });
      }
    }
  );

  app.get(
    "/api/events/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const eventId = parseInt(req.params.id);

        if (isNaN(eventId)) {
          return res.status(400).json({ message: "Invalid event ID" });
        }

        const event = await storage.getUserEvent(eventId);

        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        // Ensure the user owns this event
        if (event.userId !== userId) {
          return res.status(403).json({
            message: "You don't have permission to access this event",
          });
        }

        // Get course details if associated with a course
        let courseDetails = null;
        if (event.relatedCourseId) {
          courseDetails = await storage.getCourse(event.relatedCourseId);
        }

        res.json({
          ...event,
          course: courseDetails,
        });
      } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ message: "Error fetching event" });
      }
    }
  );

  app.post(
    "/api/events",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;

        // Add userId to the event data
        const eventData = {
          ...req.body,
          userId,
        };

        // Validate and format dates
        if (typeof eventData.startDate === "string") {
          eventData.startDate = new Date(eventData.startDate);
        }

        if (typeof eventData.endDate === "string") {
          eventData.endDate = new Date(eventData.endDate);
        }

        if (typeof eventData.reminderTime === "string") {
          eventData.reminderTime = new Date(eventData.reminderTime);
        }

        // Create event
        const event = await storage.createUserEvent(eventData);

        // Add course details if the event is associated with a course
        let courseDetails = null;
        if (event.relatedCourseId) {
          courseDetails = await storage.getCourse(event.relatedCourseId);
        }

        res.status(201).json({
          ...event,
          course: courseDetails,
          message: "Event created successfully",
        });
      } catch (error) {
        console.error("Error creating event:", error);

        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid event data", errors: error.errors });
        }

        res.status(500).json({ message: "Error creating event" });
      }
    }
  );

  app.put(
    "/api/events/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const eventId = parseInt(req.params.id);

        if (isNaN(eventId)) {
          return res.status(400).json({ message: "Invalid event ID" });
        }

        // Check if the event exists and belongs to the user
        const existingEvent = await storage.getUserEvent(eventId);
        if (!existingEvent) {
          return res.status(404).json({ message: "Event not found" });
        }

        if (existingEvent.userId !== userId) {
          return res.status(403).json({
            message: "You don't have permission to update this event",
          });
        }

        // Prepare update data
        const updateData = { ...req.body };
        delete updateData.id; // Prevent ID modification
        delete updateData.userId; // Prevent user ID modification

        // Format dates
        if (typeof updateData.startDate === "string") {
          updateData.startDate = new Date(updateData.startDate);
        }

        if (typeof updateData.endDate === "string") {
          updateData.endDate = new Date(updateData.endDate);
        }

        if (typeof updateData.reminderTime === "string") {
          updateData.reminderTime = new Date(updateData.reminderTime);
        }

        // Update the event
        const updatedEvent = await storage.updateUserEvent(eventId, updateData);

        if (!updatedEvent) {
          return res.status(500).json({ message: "Failed to update event" });
        }

        // Get course details if associated with a course
        let courseDetails = null;
        if (updatedEvent.relatedCourseId) {
          courseDetails = await storage.getCourse(updatedEvent.relatedCourseId);
        }

        res.json({
          ...updatedEvent,
          course: courseDetails,
          message: "Event updated successfully",
        });
      } catch (error) {
        console.error("Error updating event:", error);

        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid event data", errors: error.errors });
        }

        res.status(500).json({ message: "Error updating event" });
      }
    }
  );

  app.delete(
    "/api/events/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const eventId = parseInt(req.params.id);

        if (isNaN(eventId)) {
          return res.status(400).json({ message: "Invalid event ID" });
        }

        // Delete the event
        const deleted = await storage.deleteUserEvent(eventId, userId);

        if (!deleted) {
          return res.status(404).json({
            message:
              "Event not found or you don't have permission to delete it",
          });
        }

        res.json({ message: "Event deleted successfully" });
      } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Error deleting event" });
      }
    }
  );

  // User Notes API Routes
  app.get(
    "/api/notes",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const options = {
          limit: req.query.limit
            ? parseInt(req.query.limit as string)
            : undefined,
          offset: req.query.offset
            ? parseInt(req.query.offset as string)
            : undefined,
          tag: req.query.tag as string | undefined,
          courseId: req.query.courseId
            ? parseInt(req.query.courseId as string)
            : undefined,
          isPinned:
            req.query.isPinned === "true"
              ? true
              : req.query.isPinned === "false"
              ? false
              : undefined,
        };

        const notes = await storage.getUserNotes(userId, options);
        res.json(notes);
      } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ message: "Error fetching notes" });
      }
    }
  );

  app.get(
    "/api/notes/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const noteId = parseInt(req.params.id);

        if (isNaN(noteId)) {
          return res.status(400).json({ message: "Invalid note ID" });
        }

        const note = await storage.getUserNote(noteId);

        if (!note) {
          return res.status(404).json({ message: "Note not found" });
        }

        // Verify user owns this note
        const userId = (req as any).user.id;
        if (note.userId !== userId) {
          return res
            .status(403)
            .json({ message: "You don't have permission to access this note" });
        }

        res.json(note);
      } catch (error) {
        console.error("Error fetching note:", error);
        res.status(500).json({ message: "Error fetching note" });
      }
    }
  );

  app.post(
    "/api/notes",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;

        // Prepare note data
        const noteData = insertUserNoteSchema.parse({
          ...req.body,
          userId,
          createdAt: new Date(), // Will use defaultNow() from schema
        });

        const note = await storage.createUserNote(noteData);
        res.status(201).json(note);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating note:", error);
        res.status(500).json({ message: "Error creating note" });
      }
    }
  );

  app.put(
    "/api/notes/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const noteId = parseInt(req.params.id);

        if (isNaN(noteId)) {
          return res.status(400).json({ message: "Invalid note ID" });
        }

        // Verify user owns this note
        const existingNote = await storage.getUserNote(noteId);
        if (!existingNote) {
          return res.status(404).json({ message: "Note not found" });
        }

        if (existingNote.userId !== userId) {
          return res
            .status(403)
            .json({ message: "You don't have permission to update this note" });
        }

        // Update note
        const updatedNote = await storage.updateUserNote(noteId, req.body);
        if (!updatedNote) {
          return res.status(500).json({ message: "Failed to update note" });
        }

        res.json(updatedNote);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error updating note:", error);
        res.status(500).json({ message: "Error updating note" });
      }
    }
  );

  app.delete(
    "/api/notes/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const noteId = parseInt(req.params.id);

        console.log(
          `Received delete request for note ID: ${noteId} from user ID: ${userId}`
        );

        if (isNaN(noteId)) {
          console.log(`Invalid note ID: ${req.params.id}`);
          return res.status(400).json({ message: "Invalid note ID" });
        }

        // First check if the note exists and belongs to this user
        const note = await storage.getUserNote(noteId);

        if (!note) {
          console.log(`Note ID ${noteId} not found`);
          return res.status(404).json({ message: "Note not found" });
        }

        if (note.userId !== userId) {
          console.log(
            `User ${userId} attempted to delete note ${noteId} owned by user ${note.userId}`
          );
          return res
            .status(403)
            .json({ message: "You don't have permission to delete this note" });
        }

        // Delete the note
        console.log(`Deleting note ID: ${noteId}`);
        const deleted = await storage.deleteUserNote(noteId, userId);

        if (!deleted) {
          console.log(`Failed to delete note ID: ${noteId}`);
          return res.status(500).json({ message: "Failed to delete the note" });
        }

        console.log(`Successfully deleted note ID: ${noteId}`);
        res.json({ success: true, message: "Note successfully deleted" });
      } catch (error) {
        console.error("Error deleting note:", error);
        res
          .status(500)
          .json({ message: "Error deleting note", error: String(error) });
      }
    }
  );

  // Tags endpoint - Note: must be placed before the parameterized route
  app.get(
    "/api/notes-tags",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const tags = await storage.getUserNoteTags(userId);
        res.json(tags);
      } catch (error) {
        console.error("Error fetching note tags:", error);
        res.status(500).json({ message: "Error fetching note tags" });
      }
    }
  );

  // Learning Center - University Courses API Routes
  app.get("/api/university-courses", async (req: Request, res: Response) => {
    try {
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        university: req.query.university as string | undefined,
        courseDept: req.query.courseDept as string | undefined,
        search: req.query.search as string | undefined,
      };

      const courses = await storage.getUniversityCourses(options);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching university courses:", error);
      res.status(500).json({ message: "Error fetching university courses" });
    }
  });

  app.get(
    "/api/university-courses/:id([0-9]+)",
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const course = await storage.getUniversityCourse(id);

        if (!course) {
          return res
            .status(404)
            .json({ message: "University course not found" });
        }

        res.json(course);
      } catch (error) {
        console.error("Error fetching university course:", error);
        res.status(500).json({ message: "Error fetching university course" });
      }
    }
  );

  // PUT route for updating university courses
  app.put(
    "/api/university-courses/:id([0-9]+)",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const user = (req as any).user;

        // Check if the course exists
        const existingCourse = await storage.getUniversityCourse(id);
        if (!existingCourse) {
          return res
            .status(404)
            .json({ message: "University course not found" });
        }

        // Add updatedAt timestamp
        const courseData = {
          ...req.body,
          updatedAt: new Date(),
        };

        // Update the course
        const updatedCourse = await storage.updateUniversityCourse(
          id,
          courseData
        );

        res.json(updatedCourse);
      } catch (error) {
        console.error("Error updating university course:", error);
        res.status(500).json({ message: "Error updating university course" });
      }
    }
  );

  app.post(
    "/api/university-courses",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        // Any authenticated user can create university courses
        const user = (req as any).user;

        const courseData = insertUniversityCourseSchema.parse({
          ...req.body,
          createdAt: new Date().toISOString(),
        });

        // Check if course already exists
        const existingCourse = await storage.getUniversityCourseByDeptAndNumber(
          courseData.university,
          courseData.courseDept,
          courseData.courseNumber
        );

        if (existingCourse) {
          return res
            .status(409)
            .json({ message: "University course already exists" });
        }

        const newCourse = await storage.createUniversityCourse(courseData);
        res.status(201).json(newCourse);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating university course:", error);
        res.status(500).json({ message: "Error creating university course" });
      }
    }
  );

  app.get("/api/universities", async (req: Request, res: Response) => {
    try {
      const universities = await storage.getUniversities();
      res.json(universities);
    } catch (error) {
      console.error("Error fetching universities:", error);
      res.status(500).json({ message: "Error fetching universities" });
    }
  });

  app.get("/api/course-departments", async (req: Request, res: Response) => {
    try {
      const university = req.query.university as string | undefined;
      const departments = await storage.getCourseDepartments(university);
      res.json(departments);
    } catch (error) {
      console.error("Error fetching course departments:", error);
      res.status(500).json({ message: "Error fetching course departments" });
    }
  });

  // University Courses API - List all courses with filtering
  app.get("/api/university-courses", async (req: Request, res: Response) => {
    try {
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        university: req.query.university as string | undefined,
        courseDept: req.query.courseDept as string | undefined,
        search: req.query.search as string | undefined,
      };

      const courses = await storage.getUniversityCourses(options);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching university courses:", error);
      res.status(500).json({ message: "Error fetching university courses" });
    }
  });

  // Get count of university courses with the same filters
  app.get(
    "/api/university-courses/count",
    async (req: Request, res: Response) => {
      try {
        const options = {
          university: req.query.university as string | undefined,
          courseDept: req.query.courseDept as string | undefined,
          search: req.query.search as string | undefined,
        };

        const count = await storage.getUniversityCoursesCount(options);
        res.json({ count });
      } catch (error) {
        console.error("Error fetching university courses count:", error);
        res
          .status(500)
          .json({ message: "Error fetching university courses count" });
      }
    }
  );

  // University Course Bookmarks API Routes
  app.get(
    "/api/university-course-bookmarks",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const bookmarks = await storage.getUniversityCourseBookmarksByUserId(
          userId
        );

        if (bookmarks.length === 0) {
          return res.json([]);
        }

        // Get the complete course data for each bookmark
        const courseIds = bookmarks.map(
          (bookmark) => bookmark.universityCourseId
        );
        const courses = await Promise.all(
          courseIds.map((id) => storage.getUniversityCourse(id))
        );

        // Filter out any undefined courses (in case a bookmark references a deleted course)
        res.json(courses.filter(Boolean));
      } catch (error) {
        console.error("Error fetching university course bookmarks:", error);
        res
          .status(500)
          .json({ message: "Error fetching university course bookmarks" });
      }
    }
  );

  app.post(
    "/api/university-course-bookmarks",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const { universityCourseId } = req.body;

        if (!universityCourseId) {
          return res
            .status(400)
            .json({ message: "University course ID is required" });
        }

        // Check if course exists
        const course = await storage.getUniversityCourse(universityCourseId);
        if (!course) {
          return res
            .status(404)
            .json({ message: "University course not found" });
        }

        // Check if bookmark already exists
        const existingBookmark = await storage.getUniversityCourseBookmark(
          userId,
          universityCourseId
        );
        if (existingBookmark) {
          return res.status(409).json({ message: "Bookmark already exists" });
        }

        const bookmarkData = insertUniversityCourseBookmarkSchema.parse({
          userId,
          universityCourseId,
          createdAt: new Date().toISOString(),
        });

        const bookmark = await storage.createUniversityCourseBookmark(
          bookmarkData
        );
        res.status(201).json(bookmark);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating university course bookmark:", error);
        res
          .status(500)
          .json({ message: "Error creating university course bookmark" });
      }
    }
  );

  app.delete(
    "/api/university-course-bookmarks/:courseId",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const courseId = parseInt(req.params.courseId);

        const success = await storage.deleteUniversityCourseBookmark(
          userId,
          courseId
        );
        if (!success) {
          return res.status(404).json({ message: "Bookmark not found" });
        }

        res.status(204).end();
      } catch (error) {
        console.error("Error deleting university course bookmark:", error);
        res
          .status(500)
          .json({ message: "Error deleting university course bookmark" });
      }
    }
  );

  // University Course Comments API Routes
  app.get(
    "/api/university-courses/:courseId/comments",
    async (req: Request, res: Response) => {
      try {
        const courseId = parseInt(req.params.courseId);
        if (isNaN(courseId)) {
          return res.status(400).json({ message: "Invalid course ID" });
        }
        const course = await storage.getUniversityCourse(courseId);
        if (!course) {
          return res.status(404).json({ message: "University course not found" });
        }
        const comments = await storage.getUniversityCourseCommentsByCourseId(courseId);
        // Attach user info to each comment
        const commentsWithUser = await Promise.all(
          comments.map(async (comment) => {
            const user = await storage.getUser(comment.userId);
            if (!user) return { ...comment, user: null };
            const { password, ...userWithoutPassword } = user;
            return { ...comment, user: userWithoutPassword };
          })
        );
        res.json(commentsWithUser);
      } catch (error) {
        console.error("Error fetching university course comments:", error);
        res.status(500).json({ message: "Error fetching university course comments" });
      }
    }
  );

  app.post(
    "/api/university-courses/:courseId/comments",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const courseId = parseInt(req.params.courseId);
        const { content } = req.body;
        if (!content) {
          return res.status(400).json({ message: "Comment content is required" });
        }
        const course = await storage.getUniversityCourse(courseId);
        if (!course) {
          return res.status(404).json({ message: "University course not found" });
        }
        const commentData = insertUniversityCourseCommentSchema.parse({
          userId,
          courseId,
          content,
          updatedAt: new Date(),
        });
        const comment = await storage.createUniversityCourseComment(commentData);
        // Attach user info
        const user = await storage.getUser(userId);
        if (!user) return res.status(201).json(comment);
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({ ...comment, user: userWithoutPassword });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating university course comment:", error);
        res.status(500).json({ message: "Error creating university course comment" });
      }
    }
  );

  app.put(
    "/api/university-course-comments/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const commentId = parseInt(req.params.id);
        const { content } = req.body;

        if (!content) {
          return res
            .status(400)
            .json({ message: "Comment content is required" });
        }

        // Check if the comment exists and belongs to the user
        const comment = await storage.getUniversityCourseComment(commentId);
        if (!comment) {
          return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.userId !== userId) {
          return res
            .status(403)
            .json({ message: "You can only edit your own comments" });
        }

        const updatedComment = await storage.updateUniversityCourseComment(
          commentId,
          content
        );
        res.json(updatedComment);
      } catch (error) {
        console.error("Error updating university course comment:", error);
        res
          .status(500)
          .json({ message: "Error updating university course comment" });
      }
    }
  );

  app.delete(
    "/api/university-course-comments/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const commentId = parseInt(req.params.id);

        // Check if the comment exists
        const comment = await storage.getUniversityCourseComment(commentId);
        if (!comment) {
          return res.status(404).json({ message: "Comment not found" });
        }

        // Only allow the comment owner to delete it
        if (comment.userId !== userId) {
          return res
            .status(403)
            .json({ message: "You can only delete your own comments" });
        }

        const success = await storage.deleteUniversityCourseComment(
          commentId,
          userId
        );
        if (!success) {
          return res.status(500).json({ message: "Failed to delete comment" });
        }

        res.status(204).end();
      } catch (error) {
        console.error("Error deleting university course comment:", error);
        res
          .status(500)
          .json({ message: "Error deleting university course comment" });
      }
    }
  );

  // University Course Resources API Routes
  app.get(
    "/api/university-courses/:courseId/resources",
    async (req: Request, res: Response) => {
      try {
        const courseId = parseInt(req.params.courseId);
        if (isNaN(courseId)) {
          return res.status(400).json({ message: "Invalid course ID" });
        }
        const course = await storage.getUniversityCourse(courseId);
        if (!course) {
          return res.status(404).json({ message: "University course not found" });
        }
        const resources = await storage.getUniversityCourseResourcesByCourseId(courseId);
        // Attach user info to each resource
        const resourcesWithUser = await Promise.all(
          resources.map(async (resource) => {
            const user = await storage.getUser(resource.userId);
            if (!user) return { ...resource, user: null };
            const { password, ...userWithoutPassword } = user;
            return { ...resource, user: userWithoutPassword };
          })
        );
        res.json(resourcesWithUser);
      } catch (error) {
        console.error("Error fetching university course resources:", error);
        res.status(500).json({ message: "Error fetching university course resources" });
      }
    }
  );

  // Regular endpoint for URL-based resources
  app.post(
    "/api/university-courses/:courseId/resources/url",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const courseId = parseInt(req.params.courseId);
        const { title, url, description, resourceType, tags } = req.body;

        if (!title || !url) {
          return res
            .status(400)
            .json({ message: "Title and URL are required" });
        }

        // Check if the course exists
        const course = await storage.getUniversityCourse(courseId);
        if (!course) {
          return res
            .status(404)
            .json({ message: "University course not found" });
        }

        const resourceData = insertUniversityCourseResourceSchema.parse({
          userId,
          courseId,
          title,
          url,
          description: description || null,
          resourceType: resourceType || "link",
          tags: tags || [], // Include tags or empty array if not provided
          updatedAt: new Date(),
        });

        const resource = await storage.createUniversityCourseResource(
          resourceData
        );
        res.status(201).json(resource);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating university course resource:", error);
        res
          .status(500)
          .json({ message: "Error creating university course resource" });
      }
    }
  );

  // File upload endpoint for resources
  app.post(
    "/api/university-courses/:courseId/resources",
    authenticateJWT,
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const courseId = parseInt(req.params.courseId);
        const { title, description, resourceType, tags } = req.body;
        const file = req.file;

        if (!title) {
          return res.status(400).json({ message: "Title is required" });
        }

        if (!file && !req.body.url) {
          return res
            .status(400)
            .json({ message: "Either a file or URL must be provided" });
        }

        // Check if the course exists
        const course = await storage.getUniversityCourse(courseId);
        if (!course) {
          return res
            .status(404)
            .json({ message: "University course not found" });
        }

        let resourceData;

        if (file) {
          // Handle file upload case
          const relativeFilePath = getRelativePath(file.path);

          resourceData = insertUniversityCourseResourceSchema.parse({
            userId,
            courseId,
            title,
            url: null, // No URL for file uploads
            filePath: relativeFilePath,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            description: description || null,
            resourceType: resourceType || "file",
            tags: tags ? (typeof tags === "string" ? [tags] : tags) : [], // Handle string or array
            updatedAt: new Date(),
          });
        } else {
          // Handle URL case
          resourceData = insertUniversityCourseResourceSchema.parse({
            userId,
            courseId,
            title,
            url: req.body.url,
            description: description || null,
            resourceType: resourceType || "link",
            tags: tags ? (typeof tags === "string" ? [tags] : tags) : [],
            updatedAt: new Date(),
          });
        }

        const resource = await storage.createUniversityCourseResource(
          resourceData
        );
        res.status(201).json(resource);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating university course resource:", error);
        res
          .status(500)
          .json({ message: "Error creating university course resource" });
      }
    }
  );

  app.put(
    "/api/university-course-resources/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const resourceId = parseInt(req.params.id);
        const { title, url, description, resourceType, tags } = req.body;

        if (!title && !url && !description && !resourceType && !tags) {
          return res
            .status(400)
            .json({ message: "At least one field must be provided" });
        }

        // Check if the resource exists and belongs to the user
        const resource = await storage.getUniversityCourseResource(resourceId);
        if (!resource) {
          return res.status(404).json({ message: "Resource not found" });
        }

        if (resource.userId !== userId) {
          return res
            .status(403)
            .json({ message: "You can only edit your own resources" });
        }

        const updateData: Partial<InsertUniversityCourseResource> = {};
        if (title) updateData.title = title;
        if (url) updateData.url = url;
        if (description !== undefined)
          updateData.description = description || null;
        if (resourceType) updateData.resourceType = resourceType;
        if (tags !== undefined) updateData.tags = tags;

        const updatedResource = await storage.updateUniversityCourseResource(
          resourceId,
          updateData
        );
        res.json(updatedResource);
      } catch (error) {
        console.error("Error updating university course resource:", error);
        res
          .status(500)
          .json({ message: "Error updating university course resource" });
      }
    }
  );

  app.delete(
    "/api/university-course-resources/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const resourceId = parseInt(req.params.id);

        // Check if the resource exists
        const resource = await storage.getUniversityCourseResource(resourceId);
        if (!resource) {
          return res.status(404).json({ message: "Resource not found" });
        }

        // Only allow the resource owner to delete it
        if (resource.userId !== userId) {
          return res
            .status(403)
            .json({ message: "You can only delete your own resources" });
        }

        // If it's a file resource, delete the file from the filesystem
        if (resource.filePath) {
          try {
            const fs = require("fs");
            const absolutePath = getAbsolutePath(resource.filePath);
            if (fs.existsSync(absolutePath)) {
              fs.unlinkSync(absolutePath);
            }
          } catch (fileError) {
            console.error("Error deleting file:", fileError);
            // Continue with database deletion even if file deletion fails
          }
        }

        const success = await storage.deleteUniversityCourseResource(
          resourceId,
          userId
        );
        if (!success) {
          return res.status(500).json({ message: "Failed to delete resource" });
        }

        res.status(204).end();
      } catch (error) {
        console.error("Error deleting university course resource:", error);
        res
          .status(500)
          .json({ message: "Error deleting university course resource" });
      }
    }
  );

  // Download endpoint for file resources
  app.get(
    "/api/university-course-resources/:id/download",
    async (req: Request, res: Response) => {
      try {
        const resourceId = parseInt(req.params.id);

        // Get the resource
        const resource = await storage.getUniversityCourseResource(resourceId);
        if (!resource) {
          return res.status(404).json({ message: "Resource not found" });
        }

        // Check if it's a file resource
        if (!resource.filePath) {
          return res.status(400).json({
            message: "This resource does not have a file to download",
          });
        }

        // Get the file path
        const absolutePath = getAbsolutePath(resource.filePath);

        // Check if file exists
        if (!fs.existsSync(absolutePath)) {
          return res.status(404).json({ message: "File not found" });
        }

        // Set appropriate headers
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${resource.fileName}"`
        );
        if (resource.mimeType) {
          res.setHeader("Content-Type", resource.mimeType);
        }

        // Stream the file to the response
        const fileStream = fs.createReadStream(absolutePath);
        fileStream.pipe(res);
      } catch (error) {
        console.error("Error downloading file:", error);
        res.status(500).json({ message: "Error downloading file" });
      }
    }
  );

  // University Course Links API Routes
  app.get(
    "/api/university-courses/:courseId/links",
    async (req: Request, res: Response) => {
      try {
        const courseId = parseInt(req.params.courseId);

        // Check if the course exists
        const course = await storage.getUniversityCourse(courseId);
        if (!course) {
          return res
            .status(404)
            .json({ message: "University course not found" });
        }

        const links = await storage.getUniversityCourseLinksByCourseId(
          courseId
        );
        res.json(links);
      } catch (error) {
        console.error("Error fetching university course links:", error);
        res
          .status(500)
          .json({ message: "Error fetching university course links" });
      }
    }
  );

  app.post(
    "/api/university-courses/:courseId/links",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const courseId = parseInt(req.params.courseId);
        const { title, url, description, provider } = req.body;

        if (!title || !url) {
          return res
            .status(400)
            .json({ message: "Title and URL are required" });
        }

        // Check if the course exists
        const course = await storage.getUniversityCourse(courseId);
        if (!course) {
          return res
            .status(404)
            .json({ message: "University course not found" });
        }

        const linkData = insertUniversityCourseLinkSchema.parse({
          courseId,
          title,
          url,
          description: description || null,
          provider: provider || null,
          updatedAt: new Date(),
        });

        const link = await storage.createUniversityCourseLink(linkData);
        res.status(201).json(link);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating university course link:", error);
        res
          .status(500)
          .json({ message: "Error creating university course link" });
      }
    }
  );

  app.put(
    "/api/university-course-links/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const linkId = parseInt(req.params.id);
        const { title, url, description, provider } = req.body;

        // Check if the link exists
        const link = await storage.getUniversityCourseLink(linkId);
        if (!link) {
          return res.status(404).json({ message: "Link not found" });
        }

        // Create update data
        const updateData: Partial<InsertUniversityCourseLink> = {};
        if (title !== undefined) updateData.title = title;
        if (url !== undefined) updateData.url = url;
        if (description !== undefined) updateData.description = description;
        if (provider !== undefined) updateData.provider = provider;

        // Update the link
        const updatedLink = await storage.updateUniversityCourseLink(
          linkId,
          updateData
        );
        res.json(updatedLink);
      } catch (error) {
        console.error("Error updating university course link:", error);
        res
          .status(500)
          .json({ message: "Error updating university course link" });
      }
    }
  );

  app.delete(
    "/api/university-course-links/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const linkId = parseInt(req.params.id);

        // Check if the link exists
        const link = await storage.getUniversityCourseLink(linkId);
        if (!link) {
          return res.status(404).json({ message: "Link not found" });
        }

        const success = await storage.deleteUniversityCourseLink(linkId);
        if (!success) {
          return res.status(500).json({ message: "Failed to delete link" });
        }

        res.status(204).end();
      } catch (error) {
        console.error("Error deleting university course link:", error);
        res
          .status(500)
          .json({ message: "Error deleting university course link" });
      }
    }
  );

  // University Course Collaborations API Routes
  app.get(
    "/api/university-courses/:courseId/collaborations",
    async (req: Request, res: Response) => {
      try {
        const courseId = parseInt(req.params.courseId);
        const course = await storage.getUniversityCourse(courseId);
        if (!course) {
          return res.status(404).json({ message: "University course not found" });
        }
        const collaborations = await storage.getUniversityCourseCollaborationsByCourseId(courseId);
        // Attach user info to each collaboration
        const collaborationsWithUser = await Promise.all(
          collaborations.map(async (collab) => {
            const user = await storage.getUser(collab.userId);
            if (!user) return { ...collab, user: null };
            const { password, ...userWithoutPassword } = user;
            return { ...collab, user: userWithoutPassword };
          })
        );
        res.json(collaborationsWithUser);
      } catch (error) {
        console.error("Error fetching university course collaborations:", error);
        res.status(500).json({ message: "Error fetching university course collaborations" });
      }
    }
  );

  app.get(
    "/api/user/collaborations",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const collaborations = await storage.getUniversityCourseCollaborationsByUserId(userId);
        res.json(collaborations);
      } catch (error) {
        console.error("Error fetching user's university course collaborations:", error);
        res.status(500).json({
          message: "Error fetching user's university course collaborations",
        });
      }
    }
  );

  app.post(
    "/api/university-courses/:courseId/collaborations",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const courseId = parseInt(req.params.courseId);
        const { message, contactMethod, contactDetails } = req.body;

        if (!message || !contactMethod || !contactDetails) {
          return res.status(400).json({ message: "All fields are required" });
        }

        // Check if the course exists
        const course = await storage.getUniversityCourse(courseId);
        if (!course) {
          return res
            .status(404)
            .json({ message: "University course not found" });
        }

        const collaborationData = insertUniversityCourseCollaborationSchema.parse({
          userId,
          courseId,
          message,
          contactMethod,
          contactDetails,
          updatedAt: new Date(),
        });

        const collaboration = await storage.createUniversityCourseCollaboration(collaborationData);
        res.status(201).json(collaboration);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating university course collaboration:", error);
        res
          .status(500)
          .json({ message: "Error creating university course collaboration" });
      }
    }
  );

  app.delete(
    "/api/university-courses/:courseId/collaborations/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const courseId = parseInt(req.params.courseId);
        const collaborationId = parseInt(req.params.id);

        // Check if the course exists
        const course = await storage.getUniversityCourse(courseId);
        if (!course) {
          return res
            .status(404)
            .json({ message: "University course not found" });
        }

        // Check if the collaboration exists
        const collaboration = await storage.getUniversityCourseCollaboration(collaborationId);
        if (!collaboration) {
          return res
            .status(404)
            .json({ message: "Collaboration request not found" });
        }

        // Check if the user is the owner of the collaboration
        if (collaboration.userId !== userId) {
          return res.status(403).json({
            message:
              "You don't have permission to delete this collaboration request",
          });
        }

        const success = await storage.deleteUniversityCourseCollaboration(collaborationId, userId);
        if (!success) {
          return res
            .status(500)
            .json({ message: "Failed to delete collaboration request" });
        }

        res
          .status(200)
          .json({ message: "Collaboration request deleted successfully" });
      } catch (error) {
        console.error("Error deleting university course collaboration:", error);
        res
          .status(500)
          .json({ message: "Error deleting university course collaboration" });
      }
    }
  );

  app.delete(
    "/api/university-course-collaborations/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const collaborationId = parseInt(req.params.id);

        // Check if the collaboration exists
        const collaboration = await storage.getUniversityCourseCollaboration(collaborationId);
        if (!collaboration) {
          return res.status(404).json({ message: "Collaboration not found" });
        }

        // Only allow the collaboration owner to delete it
        if (collaboration.userId !== userId) {
          return res.status(403).json({
            message: "You can only delete your own collaboration listings",
          });
        }

        const success = await storage.deleteUniversityCourseCollaboration(collaborationId, userId);
        if (!success) {
          return res
            .status(500)
            .json({ message: "Failed to delete collaboration" });
        }

        res.status(204).end();
      } catch (error) {
        console.error("Error deleting university course collaboration:", error);
        res
          .status(500)
          .json({ message: "Error deleting university course collaboration" });
      }
    }
  );

  // Learning Methods API Routes
  app.get("/api/learning-methods", async (req: Request, res: Response) => {
    try {
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        userId: req.query.userId
          ? parseInt(req.query.userId as string)
          : undefined,
        difficulty: req.query.difficulty as string | undefined,
        tag: req.query.tag as string | undefined,
        search: req.query.search as string | undefined,
      };

      const methods = await storage.getLearningMethods(options);
      res.json(methods);
    } catch (error) {
      console.error("Error fetching learning methods:", error);
      res.status(500).json({ message: "Error fetching learning methods" });
    }
  });

  app.get(
    "/api/learning-methods/:id([0-9]+)",
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const method = await storage.getLearningMethod(id);

        if (!method) {
          return res.status(404).json({ message: "Learning method not found" });
        }

        // Increment view count
        await storage.incrementLearningMethodViews(id);

        res.json(method);
      } catch (error) {
        console.error("Error fetching learning method:", error);
        res.status(500).json({ message: "Error fetching learning method" });
      }
    }
  );

  app.post(
    "/api/learning-methods",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;

        const methodData = insertLearningMethodSchema.parse({
          ...req.body,
          userId,
          createdAt: new Date().toISOString(),
          views: 0,
          upvotes: 0,
        });

        const newMethod = await storage.createLearningMethod(methodData);
        res.status(201).json(newMethod);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating learning method:", error);
        res.status(500).json({ message: "Error creating learning method" });
      }
    }
  );

  app.put(
    "/api/learning-methods/:id([0-9]+)",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const id = parseInt(req.params.id);

        // Check if method exists and belongs to user
        const method = await storage.getLearningMethod(id);
        if (!method) {
          return res.status(404).json({ message: "Learning method not found" });
        }

        if (method.userId !== userId) {
          return res
            .status(403)
            .json({ message: "You can only update your own learning methods" });
        }

        const methodData = insertLearningMethodSchema.partial().parse({
          ...req.body,
          updatedAt: new Date().toISOString(),
        });

        const updatedMethod = await storage.updateLearningMethod(
          id,
          methodData
        );
        res.json(updatedMethod);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error updating learning method:", error);
        res.status(500).json({ message: "Error updating learning method" });
      }
    }
  );

  app.delete(
    "/api/learning-methods/:id([0-9]+)",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const id = parseInt(req.params.id);

        const success = await storage.deleteLearningMethod(id, userId);
        if (!success) {
          return res.status(404).json({
            message: "Learning method not found or not authorized to delete",
          });
        }

        res.status(204).end();
      } catch (error) {
        console.error("Error deleting learning method:", error);
        res.status(500).json({ message: "Error deleting learning method" });
      }
    }
  );

  app.post(
    "/api/learning-methods/:id([0-9]+)/upvote",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);

        // Check if method exists
        const method = await storage.getLearningMethod(id);
        if (!method) {
          return res.status(404).json({ message: "Learning method not found" });
        }

        await storage.incrementLearningMethodUpvotes(id);

        res
          .status(200)
          .json({ message: "Learning method upvoted successfully" });
      } catch (error) {
        console.error("Error upvoting learning method:", error);
        res.status(500).json({ message: "Error upvoting learning method" });
      }
    }
  );

  app.get("/api/learning-method-tags", async (req: Request, res: Response) => {
    try {
      const tags = await storage.getLearningMethodTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching learning method tags:", error);
      res.status(500).json({ message: "Error fetching learning method tags" });
    }
  });

  // Learning Method Comments API Routes
  app.get(
    "/api/learning-methods/:id([0-9]+)/comments",
    async (req: Request, res: Response) => {
      try {
        const methodId = parseInt(req.params.id);

        // Check if method exists
        const method = await storage.getLearningMethod(methodId);
        if (!method) {
          return res.status(404).json({ message: "Learning method not found" });
        }

        const comments = await storage.getLearningMethodCommentsByMethodId(
          methodId
        );
        res.json(comments);
      } catch (error) {
        console.error("Error fetching learning method comments:", error);
        res
          .status(500)
          .json({ message: "Error fetching learning method comments" });
      }
    }
  );

  app.post(
    "/api/learning-methods/:id([0-9]+)/comments",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const methodId = parseInt(req.params.id);

        // Check if method exists
        const method = await storage.getLearningMethod(methodId);
        if (!method) {
          return res.status(404).json({ message: "Learning method not found" });
        }

        const commentData = insertLearningMethodCommentSchema.parse({
          ...req.body,
          userId,
          methodId,
          createdAt: new Date().toISOString(),
        });

        const newComment = await storage.createLearningMethodComment(
          commentData
        );

        // Get the user information to include in the response
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(201).json(newComment); // Still return the comment if user not found
        }

        // Remove sensitive user data
        const { password, ...userWithoutPassword } = user;

        res.status(201).json({
          ...newComment,
          user: userWithoutPassword,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating learning method comment:", error);
        res
          .status(500)
          .json({ message: "Error creating learning method comment" });
      }
    }
  );

  app.delete(
    "/api/learning-methods/comments/:id([0-9]+)",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const commentId = parseInt(req.params.id);

        // Check if comment exists and belongs to the user
        const comment = await storage.getLearningMethodComment(commentId);
        if (!comment) {
          return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.userId !== userId) {
          return res
            .status(403)
            .json({ message: "You can only delete your own comments" });
        }

        // Delete the comment
        const success = await storage.deleteLearningMethodComment(
          commentId,
          userId
        );

        if (success) {
          res.status(200).json({ message: "Comment deleted successfully" });
        } else {
          res
            .status(404)
            .json({ message: "Comment not found or already deleted" });
        }
      } catch (error) {
        console.error("Error deleting learning method comment:", error);
        res
          .status(500)
          .json({ message: "Error deleting learning method comment" });
      }
    }
  );

  // Learning Method Reviews API Routes
  app.get(
    "/api/learning-methods/:methodId([0-9]+)/reviews",
    async (req: Request, res: Response) => {
      try {
        const methodId = parseInt(req.params.methodId);

        // Check if method exists
        const method = await storage.getLearningMethod(methodId);
        if (!method) {
          return res.status(404).json({ message: "Learning method not found" });
        }

        const reviews = await storage.getLearningMethodReviewsByMethodId(
          methodId
        );
        res.json(reviews);
      } catch (error) {
        console.error("Error fetching learning method reviews:", error);
        res
          .status(500)
          .json({ message: "Error fetching learning method reviews" });
      }
    }
  );

  app.post(
    "/api/learning-methods/:methodId([0-9]+)/reviews",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const methodId = parseInt(req.params.methodId);

        // Check if method exists
        const method = await storage.getLearningMethod(methodId);
        if (!method) {
          return res.status(404).json({ message: "Learning method not found" });
        }

        const reviewData = insertLearningMethodReviewSchema.parse({
          ...req.body,
          userId,
          methodId,
          createdAt: new Date().toISOString(),
        });

        const newReview = await storage.createLearningMethodReview(reviewData);
        res.status(201).json(newReview);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating learning method review:", error);
        res
          .status(500)
          .json({ message: "Error creating learning method review" });
      }
    }
  );

  // Learning Tools API Routes
  app.get("/api/learning-tools", async (req: Request, res: Response) => {
    try {
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        userId: req.query.userId
          ? parseInt(req.query.userId as string)
          : undefined,
        category: req.query.category as string | undefined,
        pricing: req.query.pricing as string | undefined,
        search: req.query.search as string | undefined,
      };

      const tools = await storage.getLearningTools(options);

      // Get user data for each tool
      const toolsWithUsers = await Promise.all(
        tools.map(async (tool) => {
          const user = await storage.getUser(tool.userId);
          if (!user) return { ...tool, user: null };

          const { password, ...userWithoutPassword } = user;
          return { ...tool, user: userWithoutPassword };
        })
      );

      res.json(toolsWithUsers);
    } catch (error) {
      console.error("Error fetching learning tools:", error);
      res.status(500).json({ message: "Error fetching learning tools" });
    }
  });

  app.get(
    "/api/learning-tools/:id([0-9]+)",
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const tool = await storage.getLearningTool(id);

        if (!tool) {
          return res.status(404).json({ message: "Learning tool not found" });
        }

        // Increment view count
        await storage.incrementLearningToolViews(id);

        res.json(tool);
      } catch (error) {
        console.error("Error fetching learning tool:", error);
        res.status(500).json({ message: "Error fetching learning tool" });
      }
    }
  );

  app.post(
    "/api/learning-tools",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;

        const toolData = insertLearningToolSchema.parse({
          ...req.body,
          userId,
          createdAt: new Date().toISOString(),
          views: 0,
          upvotes: 0,
        });

        const newTool = await storage.createLearningTool(toolData);
        res.status(201).json(newTool);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating learning tool:", error);
        res.status(500).json({ message: "Error creating learning tool" });
      }
    }
  );

  app.put(
    "/api/learning-tools/:id([0-9]+)",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const id = parseInt(req.params.id);

        // Check if tool exists and belongs to user
        const tool = await storage.getLearningTool(id);
        if (!tool) {
          return res.status(404).json({ message: "Learning tool not found" });
        }

        if (tool.userId !== userId) {
          return res
            .status(403)
            .json({ message: "You can only update your own learning tools" });
        }

        const toolData = insertLearningToolSchema.partial().parse({
          ...req.body,
          updatedAt: new Date().toISOString(),
        });

        const updatedTool = await storage.updateLearningTool(id, toolData);
        res.json(updatedTool);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error updating learning tool:", error);
        res.status(500).json({ message: "Error updating learning tool" });
      }
    }
  );

  app.delete(
    "/api/learning-tools/:id([0-9]+)",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const id = parseInt(req.params.id);

        const success = await storage.deleteLearningTool(id, userId);
        if (!success) {
          return res.status(404).json({
            message: "Learning tool not found or not authorized to delete",
          });
        }

        res.status(204).end();
      } catch (error) {
        console.error("Error deleting learning tool:", error);
        res.status(500).json({ message: "Error deleting learning tool" });
      }
    }
  );

  app.post(
    "/api/learning-tools/:id([0-9]+)/upvote",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);

        // Check if tool exists
        const tool = await storage.getLearningTool(id);
        if (!tool) {
          return res.status(404).json({ message: "Learning tool not found" });
        }

        await storage.incrementLearningToolUpvotes(id);

        res.status(200).json({ message: "Learning tool upvoted successfully" });
      } catch (error) {
        console.error("Error upvoting learning tool:", error);
        res.status(500).json({ message: "Error upvoting learning tool" });
      }
    }
  );

  app.get(
    "/api/learning-tool-categories",
    async (req: Request, res: Response) => {
      try {
        const categories = await storage.getLearningToolCategories();
        res.json(categories);
      } catch (error) {
        console.error("Error fetching learning tool categories:", error);
        res
          .status(500)
          .json({ message: "Error fetching learning tool categories" });
      }
    }
  );

  // Learning Tool Reviews API Routes
  app.get(
    "/api/learning-tools/:toolId([0-9]+)/reviews",
    async (req: Request, res: Response) => {
      try {
        const toolId = parseInt(req.params.toolId);

        // Check if tool exists
        const tool = await storage.getLearningTool(toolId);
        if (!tool) {
          return res.status(404).json({ message: "Learning tool not found" });
        }

        const reviews = await storage.getLearningToolReviewsByToolId(toolId);
        // Attach user info to each review
        const reviewsWithUser = await Promise.all(
          reviews.map(async (review) => {
            const user = await storage.getUser(review.userId);
            if (!user) return { ...review, user: null };
            const { password, ...userWithoutPassword } = user;
            return { ...review, user: userWithoutPassword };
          })
        );
        res.json(reviewsWithUser);
      } catch (error) {
        console.error("Error fetching learning tool reviews:", error);
        res
          .status(500)
          .json({ message: "Error fetching learning tool reviews" });
      }
    }
  );

  app.post(
    "/api/learning-tools/:toolId([0-9]+)/reviews",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const toolId = parseInt(req.params.toolId);

        // Check if tool exists
        const tool = await storage.getLearningTool(toolId);
        if (!tool) {
          return res.status(404).json({ message: "Learning tool not found" });
        }

        const reviewData = insertLearningToolReviewSchema.parse({
          ...req.body,
          userId,
          toolId,
          createdAt: new Date().toISOString(),
        });

        const newReview = await storage.createLearningToolReview(reviewData);
        res.status(201).json(newReview);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating learning tool review:", error);
        res
          .status(500)
          .json({ message: "Error creating learning tool review" });
      }
    }
  );

  // Chat API routes
  app.get(
    "/api/chat/messages/:receiverId",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const senderId = (req as any).user.id;
        const receiverId = parseInt(req.params.receiverId);

        // Check if these users can chat (both following each other)
        const canChat = await storage.canUsersChat(senderId, receiverId);
        if (!canChat) {
          return res.status(403).json({
            message:
              "You can only chat with users who you follow and who follow you back",
          });
        }

        // Get recent messages between the users
        const options = {
          limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
          offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        };

        const messages = await storage.getChatMessagesBetweenUsers(
          senderId,
          receiverId,
          options
        );

        // Mark messages from the receiver as read
        await storage.markChatMessagesAsRead(receiverId, senderId);

        res.json(messages);
      } catch (error) {
        console.error("Error fetching chat messages:", error);
        res.status(500).json({ message: "Error fetching chat messages" });
      }
    }
  );

  app.get(
    "/api/chat/partners",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const partners = await storage.getChatPartners(userId);
        res.json(partners);
      } catch (error) {
        console.error("Error fetching chat partners:", error);
        res.status(500).json({ message: "Error fetching chat partners" });
      }
    }
  );

  app.get(
    "/api/chat/unread-count",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const count = await storage.getUnreadMessageCount(userId);
        res.json({ count });
      } catch (error) {
        console.error("Error fetching unread message count:", error);
        res
          .status(500)
          .json({ message: "Error fetching unread message count" });
      }
    }
  );

  app.get(
    "/api/chat/can-chat/:userId",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const currentUserId = (req as any).user.id;
        const otherUserId = parseInt(req.params.userId);

        const canChat = await storage.canUsersChat(currentUserId, otherUserId);
        res.json({ canChat });
      } catch (error) {
        console.error("Error checking if users can chat:", error);
        res.status(500).json({ message: "Error checking if users can chat" });
      }
    }
  );

  // Direct CSV import for online courses - simpler implementation
  app.post(
    "/api/direct-csv-import/online",
    authenticateJWT,
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        // Check if user is authenticated
        if (!(req as any).user) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        // Check if file was uploaded
        if (!req.file) {
          return res.status(400).json({ message: "No CSV file uploaded" });
        }

        // Verify file type (should be a CSV)
        if (
          req.file.mimetype !== "text/csv" &&
          !req.file.originalname.endsWith(".csv")
        ) {
          return res
            .status(400)
            .json({ message: "File must be a CSV document" });
        }

        // Read and parse CSV file directly
        let fileContent;
        try {
          fileContent = fs.readFileSync(req.file.path, {
            encoding: "utf-8",
          });
        } catch (readError) {
          console.error("Error reading uploaded file:", readError);
          return res.status(500).json({
            message: "Error reading uploaded file",
            error:
              readError instanceof Error
                ? readError.message
                : String(readError),
          });
        }

        let records;
        try {
          records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
          });
        } catch (parseError) {
          console.error("Error parsing CSV content:", parseError);
          return res.status(400).json({
            message: "Invalid CSV format",
            error:
              parseError instanceof Error
                ? parseError.message
                : String(parseError),
          });
        }

        if (!records || records.length === 0) {
          return res
            .status(400)
            .json({ message: "CSV file is empty or has no valid rows" });
        }

        // Validate that required columns exist
        const firstRecord = records[0];
        if (!firstRecord.title || !firstRecord.url) {
          return res.status(400).json({
            message: "CSV file must contain 'title' and 'url' columns",
            columns: Object.keys(firstRecord),
          });
        }

        console.log(
          `Processing ${records.length} online courses from direct CSV import`
        );

        // Process records and insert directly into database
        const importedCount = await storage.importOnlineCoursesFromParsedCSV(
          records,
          (req as any).user.id
        );

        // Delete the temporary file after processing
        fs.unlink(req.file.path, (err) => {
          if (err)
            console.error(
              `Failed to delete temporary file ${req.file?.path}:`,
              err
            );
        });

        return res.json({
          message: `Successfully imported ${importedCount} online courses`,
          importedCount,
          totalRecords: records.length,
        });
      } catch (error) {
        console.error("Error in direct online course CSV import:", error);

        // Try to delete the temp file if it exists
        if (req.file?.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (unlinkErr) {
            console.error(
              `Failed to delete temporary file ${req.file.path}:`,
              unlinkErr
            );
          }
        }

        return res.status(500).json({
          message: "Error importing courses",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Direct CSV import for university courses - simpler implementation
  app.post(
    "/api/direct-csv-import/university",
    authenticateJWT,
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        // Check if user is authenticated
        if (!(req as any).user) {
          console.log(
            "User not authenticated for university courses CSV upload"
          );
          return res.status(401).json({ message: "Unauthorized" });
        }

        const userId = (req as any).user.id;
        console.log(
          `Processing university course CSV upload from user ${userId}`
        );

        // Check if file was uploaded
        if (!req.file) {
          console.log("No file was uploaded in the request");
          return res.status(400).json({ message: "No CSV file uploaded" });
        }

        console.log(
          `File received: ${req.file.originalname}, size: ${req.file.size} bytes`
        );

        // Verify file type (should be a CSV)
        if (
          req.file.mimetype !== "text/csv" &&
          !req.file.originalname.endsWith(".csv")
        ) {
          console.log(`Invalid file type: ${req.file.mimetype}`);
          return res
            .status(400)
            .json({ message: "File must be a CSV document" });
        }

        // Read and parse CSV file
        let fileContent;
        try {
          // Fix the issue with reading uploaded file buffer
          // The error occurs because req.file.buffer may not be available
          // depending on the storage configuration of multer
          // Need to read from the file path instead, which is always available
          if (req.file.path) {
            fileContent = fs.readFileSync(req.file.path, { encoding: "utf-8" });
          } else if (req.file.buffer) {
            fileContent = req.file.buffer.toString("utf8");
          } else {
            throw new Error(
              "Unable to access file content - neither buffer nor path is available"
            );
          }

          console.log(
            `Successfully read file content, length: ${fileContent.length} characters`
          );
        } catch (readError) {
          console.error("Error reading uploaded file:", readError);
          return res.status(500).json({
            message: "Error reading uploaded file",
            error:
              readError instanceof Error
                ? readError.message
                : String(readError),
          });
        }

        let records;
        try {
          records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
          });
          console.log(`Successfully parsed CSV with ${records.length} records`);
        } catch (parseError) {
          console.error("Error parsing CSV content:", parseError);
          return res.status(400).json({
            message: "Invalid CSV format",
            error:
              parseError instanceof Error
                ? parseError.message
                : String(parseError),
          });
        }

        if (!records || records.length === 0) {
          console.log("CSV file is empty or has no valid records");
          return res
            .status(400)
            .json({ message: "CSV file is empty or has no valid rows" });
        }

        console.log(
          `Starting university courses import with ${records.length} records`
        );

        // Import the records
        const result = await storage.importUniversityCoursesFromParsedCSV(
          records,
          userId
        );

        console.log("Import complete:", {
          importedCount: result.importedCount,
          warnings: result.warnings.length,
          failed: result.failedRecords.length,
          total: records.length,
        });

        // Return the result
        return res.json({
          ...result,
          totalRecords: records.length,
          message: `Successfully imported ${result.importedCount} out of ${records.length} university courses`,
        });
      } catch (error) {
        console.error("Error in university courses CSV import:", error);
        return res.status(500).json({
          message: "Error importing university courses",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Create HTTP server
  const server = createServer(app);

  // Initialize Socket.IO server
  const io = initializeSocketIO(server);

  // No longer need the old WebSocket server initialization
  // The rest of the server setup remains the same

  // ... rest of the original routes remain ...

  // Chat API routes
  // Add this new API endpoint for chat history that frontend is calling
  app.get(
    "/api/chat/history/:userId",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const currentUserId = (req as any).user.id;
        const otherUserId = parseInt(req.params.userId);

        console.log(
          `Fetching chat history between users ${currentUserId} and ${otherUserId}`
        );

        // Validate the user ID
        if (isNaN(otherUserId)) {
          console.error("Invalid user ID provided:", req.params.userId);
          return res.status(400).json({ message: "Invalid user ID" });
        }

        // Make sure the users exist
        const currentUser = await storage.getUser(currentUserId);
        const otherUser = await storage.getUser(otherUserId);

        if (!currentUser) {
          console.error(
            `Current user ID ${currentUserId} not found in database`
          );
          return res.status(404).json({ message: "Current user not found" });
        }

        if (!otherUser) {
          console.error(`Other user ID ${otherUserId} not found in database`);
          return res.status(404).json({ message: "User not found" });
        }

        // Check if users can chat (both following each other)
        const canChat = await storage.canUsersChat(currentUserId, otherUserId);

        if (!canChat) {
          console.log(
            `Users ${currentUserId} and ${otherUserId} cannot chat - not mutual followers`
          );
          // Return empty array instead of error for better UX
          return res.json([]);
        }

        // Get messages between the two users
        const messages = await storage.getChatMessagesBetweenUsers(
          currentUserId,
          otherUserId,
          { limit: 100, offset: 0 }
        );

        console.log(
          `Found ${messages.length} messages between users ${currentUserId} and ${otherUserId}`,
          messages
        );

        // Mark messages as read
        await storage.markChatMessagesAsRead(otherUserId, currentUserId);

        // Return the messages in chronological order
        res.json(messages);
      } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({
          message: "Error fetching chat history",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Add API endpoint for getting recent chat partners/conversations
  app.get(
    "/api/chat/recent",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;

        console.log(`Fetching recent chats for user ${userId}`);

        // Get the user's recent chat partners (people they've exchanged messages with)
        const recentChats = await storage.getRecentChatPartners(userId);

        console.log(
          `Found ${recentChats.length} recent chat partners for user ${userId}`
        );

        // For each chat partner, get the last message and basic user info
        const chatsWithLastMessages = await Promise.all(
          recentChats.map(async (partnerId) => {
            try {
              // Get partner user info
              const partner = await storage.getUser(partnerId);
              if (!partner) return null;

              // Get last message between users
              const messages = await storage.getChatMessagesBetweenUsers(
                userId,
                partnerId,
                { limit: 1, offset: 0 }
              );

              const lastMessage =
                messages.length > 0 ? messages[0].content : null;

              // Exclude password and other sensitive info
              const { password, ...safePartnerData } = partner;

              return {
                id: partnerId,
                username: safePartnerData.username,
                displayName:
                  safePartnerData.displayName || safePartnerData.username,
                lastMessage,
                lastMessageTime:
                  messages.length > 0 ? messages[0].createdAt : null,
              };
            } catch (err) {
              console.error(
                `Error getting info for chat partner ${partnerId}:`,
                err
              );
              return null;
            }
          })
        );

        // Filter out nulls and sort by most recent message
        const validChats = chatsWithLastMessages
          .filter(Boolean)
          .sort((a, b) => {
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;
            return (
              new Date(b.lastMessageTime).getTime() -
              new Date(a.lastMessageTime).getTime()
            );
          });

        res.json(validChats);
      } catch (error) {
        console.error("Error fetching recent chats:", error);
        res.status(500).json({ message: "Error fetching recent chats" });
      }
    }
  );

  app.delete(
    "/api/learning-tools/:toolId([0-9]+)/reviews/:reviewId([0-9]+)",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const toolId = parseInt(req.params.toolId);
        const reviewId = parseInt(req.params.reviewId);

        // Check if review exists
        const review = await storage.getLearningToolReview(reviewId);
        if (!review) {
          return res.status(404).json({ message: "Review not found" });
        }
        if (review.userId !== userId) {
          return res.status(403).json({ message: "You can only delete your own reviews" });
        }

        const success = await storage.deleteLearningToolReview(reviewId, userId);
        if (!success) {
          return res.status(404).json({ message: "Review not found or already deleted" });
        }
        res.status(204).end();
      } catch (error) {
        console.error("Error deleting learning tool review:", error);
        res.status(500).json({ message: "Error deleting learning tool review" });
      }
    }
  );

  return server;
}
