import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { 
  insertUserSchema, insertBookmarkSchema, insertSubscriberSchema, 
  insertCommentSchema, insertSearchHistorySchema,
  // Learning post schemas
  insertLearningPostSchema, insertLearningPostCommentSchema,
  insertLearningPostLikeSchema, insertLearningPostBookmarkSchema
} from "@shared/schema";
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
        return res.status(200)
          .header("Content-Type", "application/json")
          .json({ message: "You're already subscribed to our newsletter!" });
      }
      
      // Create subscriber
      const subscriberData = insertSubscriberSchema.parse({
        email,
        createdAt: new Date().toISOString(),
        status: 'active'
      });
      
      await storage.createSubscriber(subscriberData);
      
      res.status(201)
        .header("Content-Type", "application/json")
        .json({ message: "Successfully subscribed to the newsletter!" });
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      res.status(500)
        .header("Content-Type", "application/json")
        .json({ message: "Error processing subscription" });
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
  
  // Comment routes
  app.get("/api/courses/:courseId/comments", async (req: Request, res: Response) => {
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
      const commentsWithUserData = await Promise.all(comments.map(async (comment) => {
        const user = await storage.getUser(comment.userId);
        if (!user) {
          return {
            ...comment,
            user: { username: "Unknown User" }
          };
        }
        
        const { password, ...userWithoutPassword } = user;
        return {
          ...comment,
          user: userWithoutPassword
        };
      }));
      
      res.json(commentsWithUserData);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Error fetching comments" });
    }
  });
  
  app.post("/api/courses/:courseId/comments", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const courseId = parseInt(req.params.courseId);
      
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      // Validate input
      const { content, rating } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Comment content is required" });
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
        user: userWithoutPassword
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Error creating comment" });
    }
  });
  
  app.put("/api/comments/:id", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const commentId = parseInt(req.params.id);
      
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }
      
      // Validate input
      const { content, rating } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      // Check if the comment exists and belongs to the user
      const comment = await storage.getCommentById(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      if (comment.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this comment" });
      }
      
      // Update comment
      const updatedComment = await storage.updateComment(commentId, content, rating);
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
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "Error updating comment" });
    }
  });
  
  app.delete("/api/comments/:id", authenticateJWT, async (req: Request, res: Response) => {
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
          message: "Comment not found or you don't have permission to delete it" 
        });
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Error deleting comment" });
    }
  });

  // Learning Post Routes
  // Get all learning posts with optional filtering
  app.get("/api/learning-posts", async (req: Request, res: Response) => {
    try {
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        type: req.query.type as string | undefined,
        tag: req.query.tag as string | undefined,
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined
      };

      const posts = await storage.getLearningPosts(options);
      
      // Get user data for each post
      const postsWithUsers = await Promise.all(posts.map(async (post) => {
        const user = await storage.getUser(post.userId);
        if (!user) return { ...post, user: null };
        
        const { password, ...userWithoutPassword } = user;
        return { ...post, user: userWithoutPassword };
      }));
      
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
      
      // Get user data
      const user = await storage.getUser(post.userId);
      if (!user) {
        return res.status(500).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        ...post,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Error fetching learning post:", error);
      res.status(500).json({ message: "Error fetching learning post" });
    }
  });

  // Create a new learning post
  app.post("/api/learning-posts", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      
      const postData = insertLearningPostSchema.parse({
        ...req.body,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
        user: userWithoutPassword
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Error creating learning post:", error);
      res.status(500).json({ message: "Error creating learning post" });
    }
  });

  // Update a learning post
  app.put("/api/learning-posts/:id", authenticateJWT, async (req: Request, res: Response) => {
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
        return res.status(403).json({ message: "You don't have permission to update this post" });
      }
      
      // Update post
      const postData = {
        ...req.body,
        updatedAt: new Date().toISOString()
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
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Error updating learning post:", error);
      res.status(500).json({ message: "Error updating learning post" });
    }
  });

  // Delete a learning post
  app.delete("/api/learning-posts/:id", authenticateJWT, async (req: Request, res: Response) => {
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
          message: "Post not found or you don't have permission to delete it" 
        });
      }
    } catch (error) {
      console.error("Error deleting learning post:", error);
      res.status(500).json({ message: "Error deleting learning post" });
    }
  });

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
  app.get("/api/learning-posts/:postId/comments", async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const comments = await storage.getLearningPostCommentsByPostId(postId);
      
      // Get user data for each comment
      const commentsWithUsers = await Promise.all(comments.map(async (comment) => {
        const user = await storage.getUser(comment.userId);
        if (!user) return { ...comment, user: null };
        
        const { password, ...userWithoutPassword } = user;
        return { ...comment, user: userWithoutPassword };
      }));
      
      res.json(commentsWithUsers);
    } catch (error) {
      console.error("Error fetching learning post comments:", error);
      res.status(500).json({ message: "Error fetching learning post comments" });
    }
  });

  // Create a comment on a learning post
  app.post("/api/learning-posts/:postId/comments", authenticateJWT, async (req: Request, res: Response) => {
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
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      const commentData = insertLearningPostCommentSchema.parse({
        postId,
        userId,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
        user: userWithoutPassword
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Error creating learning post comment:", error);
      res.status(500).json({ message: "Error creating learning post comment" });
    }
  });

  // Update a learning post comment
  app.put("/api/learning-post-comments/:id", authenticateJWT, async (req: Request, res: Response) => {
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
        return res.status(403).json({ message: "You don't have permission to update this comment" });
      }
      
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      // Update comment
      const updatedComment = await storage.updateLearningPostComment(commentId, content);
      
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
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Error updating learning post comment:", error);
      res.status(500).json({ message: "Error updating learning post comment" });
    }
  });

  // Delete a learning post comment
  app.delete("/api/learning-post-comments/:id", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const commentId = parseInt(req.params.id);
      
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }
      
      // Attempt to delete the comment
      const success = await storage.deleteLearningPostComment(commentId, userId);
      
      if (success) {
        return res.status(204).send();
      } else {
        return res.status(404).json({ 
          message: "Comment not found or you don't have permission to delete it" 
        });
      }
    } catch (error) {
      console.error("Error deleting learning post comment:", error);
      res.status(500).json({ message: "Error deleting learning post comment" });
    }
  });

  // Learning Post Like Routes
  // Like a learning post
  app.post("/api/learning-posts/:postId/like", authenticateJWT, async (req: Request, res: Response) => {
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
        return res.status(409).json({ message: "You have already liked this post" });
      }
      
      const likeData = insertLearningPostLikeSchema.parse({
        postId,
        userId,
        createdAt: new Date().toISOString()
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
  });

  // Unlike a learning post
  app.delete("/api/learning-posts/:postId/like", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const postId = parseInt(req.params.postId);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // Check if like exists
      const existingLike = await storage.getLearningPostLike(postId, userId);
      if (!existingLike) {
        return res.status(404).json({ message: "You have not liked this post" });
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
  });

  // Check if user has liked a post and get like count
  app.get("/api/learning-posts/:postId/like", authenticateJWT, async (req: Request, res: Response) => {
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
        count: likeCount
      });
    } catch (error) {
      console.error("Error checking like status:", error);
      res.status(500).json({ message: "Error checking like status" });
    }
  });

  // Learning Post Bookmark Routes
  // Get user's bookmarked learning posts
  app.get("/api/learning-post-bookmarks", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      
      const bookmarks = await storage.getLearningPostBookmarksByUserId(userId);
      
      if (bookmarks.length === 0) {
        return res.json([]);
      }
      
      // Get posts for all bookmarks
      const postPromises = bookmarks.map(bookmark => 
        storage.getLearningPost(bookmark.postId)
      );
      
      const posts = await Promise.all(postPromises);
      const validPosts = posts.filter(post => post !== undefined) as typeof posts;
      
      // Get user data for each post
      const postsWithUsers = await Promise.all(validPosts.map(async (post) => {
        const user = await storage.getUser(post!.userId);
        if (!user) return { ...post, user: null };
        
        const { password, ...userWithoutPassword } = user;
        return { ...post, user: userWithoutPassword };
      }));
      
      res.json(postsWithUsers);
    } catch (error) {
      console.error("Error fetching learning post bookmarks:", error);
      res.status(500).json({ message: "Error fetching learning post bookmarks" });
    }
  });

  // Bookmark a learning post
  app.post("/api/learning-posts/:postId/bookmark", authenticateJWT, async (req: Request, res: Response) => {
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
      const existingBookmark = await storage.getLearningPostBookmark(postId, userId);
      if (existingBookmark) {
        return res.status(409).json({ message: "You have already bookmarked this post" });
      }
      
      const bookmarkData = insertLearningPostBookmarkSchema.parse({
        postId,
        userId,
        createdAt: new Date().toISOString()
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
  });

  // Remove a bookmark from a learning post
  app.delete("/api/learning-posts/:postId/bookmark", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const postId = parseInt(req.params.postId);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // Check if bookmark exists
      const existingBookmark = await storage.getLearningPostBookmark(postId, userId);
      if (!existingBookmark) {
        return res.status(404).json({ message: "You have not bookmarked this post" });
      }
      
      // Remove bookmark
      await storage.deleteLearningPostBookmark(postId, userId);
      
      res.json({ bookmarked: false });
    } catch (error) {
      console.error("Error removing learning post bookmark:", error);
      res.status(500).json({ message: "Error removing learning post bookmark" });
    }
  });

  // Check if user has bookmarked a post
  app.get("/api/learning-posts/:postId/bookmark", authenticateJWT, async (req: Request, res: Response) => {
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
        bookmarked: !!bookmark
      });
    } catch (error) {
      console.error("Error checking bookmark status:", error);
      res.status(500).json({ message: "Error checking bookmark status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
