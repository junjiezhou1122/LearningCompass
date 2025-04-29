import { pgTable, text, serial, integer, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: text("created_at").notNull()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  createdAt: true
});

// Course schema
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  shortIntro: text("short_intro"),
  category: text("category"),
  subCategory: text("sub_category"),
  courseType: text("course_type"),
  language: text("language"),
  subtitleLanguages: text("subtitle_languages"),
  skills: text("skills"),
  instructors: text("instructors"),
  rating: doublePrecision("rating"),
  numberOfViewers: integer("number_of_viewers"),
  duration: text("duration"),
  site: text("site"),
  imageUrl: text("image_url"),
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  title: true,
  url: true,
  shortIntro: true,
  category: true,
  subCategory: true,
  courseType: true,
  language: true,
  subtitleLanguages: true,
  skills: true,
  instructors: true,
  rating: true,
  numberOfViewers: true,
  duration: true,
  site: true,
  imageUrl: true,
});

// Bookmark schema
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  createdAt: text("created_at").notNull()
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).pick({
  userId: true,
  courseId: true,
  createdAt: true
});

// Search history schema
export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  searchQuery: text("search_query").notNull(),
  createdAt: text("created_at").notNull()
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).pick({
  userId: true,
  searchQuery: true,
  createdAt: true
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = typeof searchHistory.$inferInsert;
