import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  doublePrecision,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  photoURL: text("photo_url"),
  authProvider: text("auth_provider"),
  providerId: text("provider_id"),
  createdAt: text("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  phoneNumber: true,
  firstName: true,
  lastName: true,
  photoURL: true,
  authProvider: true,
  providerId: true,
  createdAt: true,
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
  createdAt: text("created_at").notNull(),
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).pick({
  userId: true,
  courseId: true,
  createdAt: true,
});

// Search history schema
export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  searchQuery: text("search_query").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).pick(
  {
    userId: true,
    searchQuery: true,
    createdAt: true,
  }
);

// Subscribers schema
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: text("created_at").notNull(),
  status: text("status").notNull(),
});

export const insertSubscriberSchema = createInsertSchema(subscribers).pick({
  email: true,
  createdAt: true,
  status: true,
});

// Comments schema
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  content: text("content").notNull(),
  rating: integer("rating"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  userId: true,
  courseId: true,
  content: true,
  rating: true,
  createdAt: true,
  updatedAt: true,
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookmarks: many(bookmarks),
  searchHistory: many(searchHistory),
  comments: many(comments),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  bookmarks: many(bookmarks),
  comments: many(comments),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [bookmarks.courseId],
    references: [courses.id],
  }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [comments.courseId],
    references: [courses.id],
  }),
}));

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = typeof searchHistory.$inferInsert;

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = typeof subscribers.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// Learning Posts schema
export const learningPosts = pgTable("learning_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'thought', 'resource', or 'method'
  resourceLink: text("resource_link"),
  tags: text("tags").array(), // Store tags as array
  views: integer("views").default(0).notNull(), // Track number of views
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertLearningPostSchema = createInsertSchema(learningPosts).pick({
  userId: true,
  title: true,
  content: true,
  type: true,
  resourceLink: true,
  tags: true,
});

// Learning Post Comments schema
export const learningPostComments = pgTable("learning_post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertLearningPostCommentSchema = createInsertSchema(
  learningPostComments
).pick({
  postId: true,
  userId: true,
  content: true,
});

// Learning Post Likes schema
export const learningPostLikes = pgTable("learning_post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLearningPostLikeSchema = createInsertSchema(
  learningPostLikes
).pick({
  postId: true,
  userId: true,
});

// Learning Post Bookmarks schema
export const learningPostBookmarks = pgTable("learning_post_bookmarks", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLearningPostBookmarkSchema = createInsertSchema(
  learningPostBookmarks
).pick({
  postId: true,
  userId: true,
});

// Learning Post Relations
export const learningPostsRelations = relations(
  learningPosts,
  ({ many, one }) => ({
    user: one(users, {
      fields: [learningPosts.userId],
      references: [users.id],
    }),
    comments: many(learningPostComments),
    likes: many(learningPostLikes),
    bookmarks: many(learningPostBookmarks),
  })
);

export const learningPostCommentsRelations = relations(
  learningPostComments,
  ({ one }) => ({
    post: one(learningPosts, {
      fields: [learningPostComments.postId],
      references: [learningPosts.id],
    }),
    user: one(users, {
      fields: [learningPostComments.userId],
      references: [users.id],
    }),
  })
);

export const learningPostLikesRelations = relations(
  learningPostLikes,
  ({ one }) => ({
    post: one(learningPosts, {
      fields: [learningPostLikes.postId],
      references: [learningPosts.id],
    }),
    user: one(users, {
      fields: [learningPostLikes.userId],
      references: [users.id],
    }),
  })
);

export const learningPostBookmarksRelations = relations(
  learningPostBookmarks,
  ({ one }) => ({
    post: one(learningPosts, {
      fields: [learningPostBookmarks.postId],
      references: [learningPosts.id],
    }),
    user: one(users, {
      fields: [learningPostBookmarks.userId],
      references: [users.id],
    }),
  })
);

// User follows table
export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id")
    .notNull()
    .references(() => users.id),
  followingId: integer("following_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserFollowSchema = createInsertSchema(userFollows).pick({
  followerId: true,
  followingId: true,
});

// Follows relations
export const userFollowsRelations = relations(userFollows, ({ one }) => ({
  follower: one(users, {
    fields: [userFollows.followerId],
    references: [users.id],
    relationName: "follower",
  }),
  following: one(users, {
    fields: [userFollows.followingId],
    references: [users.id],
    relationName: "following",
  }),
}));

// Update user relations to include learning posts and follows
export const usersLearningRelations = relations(users, ({ many }) => ({
  learningPosts: many(learningPosts),
  learningPostComments: many(learningPostComments),
  learningPostLikes: many(learningPostLikes),
  learningPostBookmarks: many(learningPostBookmarks),
  followers: many(userFollows, { relationName: "following" }),
  following: many(userFollows, { relationName: "follower" }),
}));

// Type definitions for learning posts
export type LearningPost = typeof learningPosts.$inferSelect;
export type InsertLearningPost = typeof learningPosts.$inferInsert;

export type LearningPostComment = typeof learningPostComments.$inferSelect;
export type InsertLearningPostComment =
  typeof learningPostComments.$inferInsert;

export type LearningPostLike = typeof learningPostLikes.$inferSelect;
export type InsertLearningPostLike = typeof learningPostLikes.$inferInsert;

export type LearningPostBookmark = typeof learningPostBookmarks.$inferSelect;
export type InsertLearningPostBookmark =
  typeof learningPostBookmarks.$inferInsert;

export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = typeof userFollows.$inferInsert;

// AI Conversations schema
export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  provider: text("provider").notNull(), // openai, anthropic, openrouter, custom
  model: text("model").notNull(), // Model identifier
  messages: text("messages").notNull(), // JSON string of messages
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertAiConversationSchema = createInsertSchema(
  aiConversations
).pick({
  userId: true,
  title: true,
  provider: true,
  model: true,
  messages: true,
  updatedAt: true,
});

export const aiConversationsRelations = relations(
  aiConversations,
  ({ one }) => ({
    user: one(users, {
      fields: [aiConversations.userId],
      references: [users.id],
    }),
  })
);

// Update user relations to include AI conversations
export const usersAiRelations = relations(users, ({ many }) => ({
  aiConversations: many(aiConversations),
}));

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;

// Method applications schema - for tracking when users apply methods
export const methodApplications = pgTable("method_applications", {
  id: serial("id").primaryKey(),
  methodPostId: integer("method_post_id")
    .notNull()
    .references(() => learningPosts.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  status: varchar("status", { length: 50 }).notNull(), // 'active', 'completed', 'abandoned'
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  rating: integer("rating"), // Users can rate how effective the method was
  feedback: text("feedback"), // User feedback about their experience
  progress: text("progress"), // JSON for tracking steps or progress
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertMethodApplicationSchema = createInsertSchema(
  methodApplications
).pick({
  methodPostId: true,
  userId: true,
  status: true,
  startDate: true,
  endDate: true,
  rating: true,
  feedback: true,
  progress: true,
  updatedAt: true,
});

// Method application relations
export const methodApplicationsRelations = relations(
  methodApplications,
  ({ one }) => ({
    post: one(learningPosts, {
      fields: [methodApplications.methodPostId],
      references: [learningPosts.id],
    }),
    user: one(users, {
      fields: [methodApplications.userId],
      references: [users.id],
    }),
  })
);

// Update user relations to include method applications
export const usersMethodRelations = relations(users, ({ many }) => ({
  methodApplications: many(methodApplications),
}));

// Update learning post relations to include method applications
export const learningPostMethodRelations = relations(
  learningPosts,
  ({ many }) => ({
    methodApplications: many(methodApplications),
  })
);

export type MethodApplication = typeof methodApplications.$inferSelect;
export type InsertMethodApplication = typeof methodApplications.$inferInsert;
