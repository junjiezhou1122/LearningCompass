import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { insertUserSchema, insertBookmarkSchema, insertSubscriberSchema } from "@shared/schema";
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
// Import data already complete
// import { importCoursesFromCSV } from "./utils/courseParser";
import { authenticateJWT, generateToken } from "./utils/auth";

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
        return res.status(200).json({ message: "You're already subscribed to our newsletter!" });
      }
      
      // Create subscriber
      const subscriberData = insertSubscriberSchema.parse({
        email,
        createdAt: new Date().toISOString(),
        status: 'active'
      });
      
      await storage.createSubscriber(subscriberData);
      
      res.status(201).json({ message: "Successfully subscribed to the newsletter!" });
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      res.status(500).json({ message: "Error processing subscription" });
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse({
        ...req.body,
        createdAt: new Date().toISOString(),
      });

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username) || 
                          await storage.getUserByEmail(userData.email);
      
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

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
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
        rating: req.query.rating ? parseFloat(req.query.rating as string) : undefined,
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
        rating: req.query.rating ? parseFloat(req.query.rating as string) : undefined,
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

  // Bookmark routes (protected)
  app.get("/api/bookmarks", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const bookmarks = await storage.getBookmarksByUserId(userId);
      
      if (bookmarks.length === 0) {
        return res.json([]);
      }
      
      const courseIds = bookmarks.map(bookmark => bookmark.courseId);
      const courses = await storage.getCoursesByIds(courseIds);
      
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Error fetching bookmarks" });
    }
  });

  app.post("/api/bookmarks", authenticateJWT, async (req: Request, res: Response) => {
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
  });

  app.delete("/api/bookmarks/:courseId", authenticateJWT, async (req: Request, res: Response) => {
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
  });

  // User profile route (protected)
  app.get("/api/profile", authenticateJWT, async (req: Request, res: Response) => {
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
  });

  // Search history routes (protected)
  app.post("/api/search-history", authenticateJWT, async (req: Request, res: Response) => {
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
      
      const searchHistory = await storage.createSearchHistory(searchHistoryData);
      res.status(201).json(searchHistory);
    } catch (error) {
      res.status(500).json({ message: "Error saving search history" });
    }
  });

  app.get("/api/search-history", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const searchHistory = await storage.getSearchHistoryByUserId(userId);
      res.json(searchHistory);
    } catch (error) {
      res.status(500).json({ message: "Error fetching search history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
