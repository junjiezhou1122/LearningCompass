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
  firebaseId: text("firebase_id").unique(),
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
  firebaseId: true,
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
  contextData: text("context_data"), // Extracted context from page as JSON
  pageUrl: text("page_url"), // URL of the page where conversation started
  pageTitle: text("page_title"), // Title of the page where conversation started
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
  contextData: true,
  pageUrl: true,
  pageTitle: true,
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

// User Gamification schema
export const userGamification = pgTable("user_gamification", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  level: integer("level").notNull().default(1),
  points: integer("points").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertUserGamificationSchema = createInsertSchema(
  userGamification
).pick({
  userId: true,
  level: true,
  points: true,
  streak: true,
  lastActivity: true,
  updatedAt: true,
});

// User Badges schema
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  badgeId: integer("badge_id").notNull(),
  badgeName: text("badge_name").notNull(),
  badgeDescription: text("badge_description").notNull(),
  badgeIcon: text("badge_icon").notNull(),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
});

export const insertUserBadgeSchema = createInsertSchema(
  userBadges
).pick({
  userId: true,
  badgeId: true,
  badgeName: true,
  badgeDescription: true,
  badgeIcon: true,
});

// User recommendations
export const userRecommendations = pgTable("user_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id),
  score: doublePrecision("score").notNull(),
  reason: text("reason").notNull(),
  trending: boolean("trending").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertUserRecommendationSchema = createInsertSchema(
  userRecommendations
).pick({
  userId: true,
  courseId: true,
  score: true,
  reason: true,
  trending: true,
  updatedAt: true,
});

// Gamification relations
export const userGamificationRelations = relations(
  userGamification,
  ({ one }) => ({
    user: one(users, {
      fields: [userGamification.userId],
      references: [users.id],
    }),
  })
);

export const userBadgesRelations = relations(
  userBadges,
  ({ one }) => ({
    user: one(users, {
      fields: [userBadges.userId],
      references: [users.id],
    }),
  })
);

export const userRecommendationsRelations = relations(
  userRecommendations,
  ({ one }) => ({
    user: one(users, {
      fields: [userRecommendations.userId],
      references: [users.id],
    }),
    course: one(courses, {
      fields: [userRecommendations.courseId],
      references: [courses.id],
    }),
  })
);

// Update user relations to include gamification
export const usersGamificationRelations = relations(users, ({ one, many }) => ({
  gamification: one(userGamification),
  badges: many(userBadges),
  recommendations: many(userRecommendations),
}));

// Type definitions for user gamification
export type UserGamification = typeof userGamification.$inferSelect;
export type InsertUserGamification = typeof userGamification.$inferInsert;

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

export type UserRecommendation = typeof userRecommendations.$inferSelect;
export type InsertUserRecommendation = typeof userRecommendations.$inferInsert;

// User Events schema
export const userEvents = pgTable("user_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location"),
  isAllDay: boolean("is_all_day").default(false),
  isCompleted: boolean("is_completed").default(false),
  reminderSet: boolean("reminder_set").default(false),
  reminderTime: timestamp("reminder_time"),
  color: text("color"),
  eventType: varchar("event_type", { length: 50 }).default("learning").notNull(), // 'learning', 'exam', 'deadline', etc.
  relatedCourseId: integer("related_course_id").references(() => courses.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertUserEventSchema = createInsertSchema(userEvents).pick({
  userId: true,
  title: true,
  description: true,
  startDate: true,
  endDate: true,
  location: true,
  isAllDay: true,
  isCompleted: true,
  reminderSet: true,
  reminderTime: true,
  color: true,
  eventType: true,
  relatedCourseId: true,
});

// User Events Relations
export const userEventsRelations = relations(userEvents, ({ one }) => ({
  user: one(users, {
    fields: [userEvents.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [userEvents.relatedCourseId],
    references: [courses.id],
  }),
}));

// Update user relations to include events
export const usersEventsRelations = relations(users, ({ many }) => ({
  events: many(userEvents),
}));

// Update courses relations to include events
export const coursesEventsRelations = relations(courses, ({ many }) => ({
  events: many(userEvents),
}));

// Type definitions for user events
export type UserEvent = typeof userEvents.$inferSelect;
export type InsertUserEvent = typeof userEvents.$inferInsert;

// User Notes schema
export const userNotes = pgTable("user_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  pageUrl: text("page_url"), // URL of the page where note was taken
  pageTitle: text("page_title"), // Title of the page where note was taken
  courseId: integer("course_id").references(() => courses.id),
  tags: text("tags").array(), // Store tags as array
  color: text("color").default("#FFFFFF"), // For note organization/categorization
  isPinned: boolean("is_pinned").default(false),
  imageUrl: text("image_url"), // Optional image attachment URL
  fontSize: text("font_size").default("normal"), // Font size preference: small, normal, large
  position: text("position"), // Store position as JSON {x, y} for drag-and-drop positioning
  isExpanded: boolean("is_expanded").default(false), // Whether note is in expanded view
  textAlignment: text("text_alignment").default("left"), // Text alignment: left, center, right
  isRichText: boolean("is_rich_text").default(false), // Whether to use rich text formatting
  timestamp: text("timestamp"), // Timestamp inserted by user
  reminderDate: text("reminder_date"), // Reminder date for the note
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertUserNoteSchema = createInsertSchema(userNotes).pick({
  userId: true,
  content: true,
  pageUrl: true,
  pageTitle: true,
  courseId: true,
  tags: true,
  color: true,
  isPinned: true,
  imageUrl: true,
  fontSize: true,
  position: true,
  isExpanded: true,
  textAlignment: true,
  isRichText: true,
  timestamp: true,
  reminderDate: true,
  updatedAt: true,
});

// User Notes Relations
export const userNotesRelations = relations(userNotes, ({ one }) => ({
  user: one(users, {
    fields: [userNotes.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [userNotes.courseId],
    references: [courses.id],
  }),
}));

// Update user relations to include notes
export const usersNotesRelations = relations(users, ({ many }) => ({
  notes: many(userNotes),
}));

// Update courses relations to include notes
export const coursesNotesRelations = relations(courses, ({ many }) => ({
  notes: many(userNotes),
}));

// Type definitions for user notes
export type UserNote = typeof userNotes.$inferSelect;
export type InsertUserNote = typeof userNotes.$inferInsert;

// University Courses schema
export const universityCourses = pgTable("university_courses", {
  id: serial("id").primaryKey(),
  university: text("university").notNull(),
  courseDept: text("course_dept").notNull(),
  courseNumber: text("course_number").notNull(),
  courseTitle: text("course_title").notNull(),
  description: text("description"),
  professors: text("professors"),
  recentSemesters: text("recent_semesters"),
  credits: text("credits"),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertUniversityCourseSchema = createInsertSchema(universityCourses).pick({
  university: true,
  courseDept: true,
  courseNumber: true,
  courseTitle: true,
  description: true,
  professors: true,
  recentSemesters: true,
  credits: true,
  url: true,
  updatedAt: true,
});

// Learning Methods schema
export const learningMethods = pgTable("learning_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  steps: text("steps").array(), // Array of steps to follow for this method
  tags: text("tags").array(), // Categories or tags for this method
  difficulty: varchar("difficulty", { length: 20 }), // e.g., 'beginner', 'intermediate', 'advanced'
  timeRequired: text("time_required"), // Estimated time to apply this method
  benefits: text("benefits").array(), // Array of benefits
  resources: text("resources").array(), // Supporting resources
  upvotes: integer("upvotes").default(0),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertLearningMethodSchema = createInsertSchema(learningMethods).pick({
  userId: true,
  title: true,
  description: true,
  steps: true,
  tags: true,
  difficulty: true,
  timeRequired: true,
  benefits: true,
  resources: true,
  updatedAt: true,
});

// Learning Tools schema
export const learningTools = pgTable("learning_tools", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  url: text("url"),
  category: text("category"), // e.g., 'note-taking', 'flashcards', 'time-management'
  pricing: text("pricing"), // e.g., 'free', 'freemium', 'paid'
  platforms: text("platforms").array(), // e.g., ['web', 'ios', 'android']
  pros: text("pros").array(),
  cons: text("cons").array(),
  alternatives: text("alternatives").array(),
  upvotes: integer("upvotes").default(0),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertLearningToolSchema = createInsertSchema(learningTools).pick({
  userId: true,
  name: true,
  description: true,
  url: true,
  category: true,
  pricing: true,
  platforms: true,
  pros: true,
  cons: true,
  alternatives: true,
  updatedAt: true,
});

// University Course Bookmarks schema
export const universityCourseBookmarks = pgTable("university_course_bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  universityCourseId: integer("university_course_id")
    .notNull()
    .references(() => universityCourses.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUniversityCourseBookmarkSchema = createInsertSchema(universityCourseBookmarks).pick({
  userId: true,
  universityCourseId: true,
});

// Learning Method Reviews schema
export const learningMethodReviews = pgTable("learning_method_reviews", {
  id: serial("id").primaryKey(),
  methodId: integer("method_id")
    .notNull()
    .references(() => learningMethods.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  rating: integer("rating").notNull(), // 1-5 rating
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertLearningMethodReviewSchema = createInsertSchema(learningMethodReviews).pick({
  methodId: true,
  userId: true,
  content: true,
  rating: true,
  updatedAt: true,
});

// Learning Tool Reviews schema
export const learningToolReviews = pgTable("learning_tool_reviews", {
  id: serial("id").primaryKey(),
  toolId: integer("tool_id")
    .notNull()
    .references(() => learningTools.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  rating: integer("rating").notNull(), // 1-5 rating
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertLearningToolReviewSchema = createInsertSchema(learningToolReviews).pick({
  toolId: true,
  userId: true,
  content: true,
  rating: true,
  updatedAt: true,
});

// Chat Messages schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id),
  receiverId: integer("receiver_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  senderId: true,
  receiverId: true,
  content: true,
  isRead: true,
});

// Chat Messages Relations
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [chatMessages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

// University Courses Relations
export const universityCoursesRelations = relations(universityCourses, ({ many }) => ({
  bookmarks: many(universityCourseBookmarks),
}));

export const universityCourseBookmarksRelations = relations(universityCourseBookmarks, ({ one }) => ({
  user: one(users, {
    fields: [universityCourseBookmarks.userId],
    references: [users.id],
  }),
  course: one(universityCourses, {
    fields: [universityCourseBookmarks.universityCourseId],
    references: [universityCourses.id],
  }),
}));

// Learning Methods Relations
export const learningMethodsRelations = relations(learningMethods, ({ many, one }) => ({
  user: one(users, {
    fields: [learningMethods.userId],
    references: [users.id],
  }),
  reviews: many(learningMethodReviews),
}));

export const learningMethodReviewsRelations = relations(learningMethodReviews, ({ one }) => ({
  method: one(learningMethods, {
    fields: [learningMethodReviews.methodId],
    references: [learningMethods.id],
  }),
  user: one(users, {
    fields: [learningMethodReviews.userId],
    references: [users.id],
  }),
}));

// Learning Tools Relations
export const learningToolsRelations = relations(learningTools, ({ many, one }) => ({
  user: one(users, {
    fields: [learningTools.userId],
    references: [users.id],
  }),
  reviews: many(learningToolReviews),
}));

export const learningToolReviewsRelations = relations(learningToolReviews, ({ one }) => ({
  tool: one(learningTools, {
    fields: [learningToolReviews.toolId],
    references: [learningTools.id],
  }),
  user: one(users, {
    fields: [learningToolReviews.userId],
    references: [users.id],
  }),
}));

// Update user relations to include learning center entities
export const usersLearningCenterRelations = relations(users, ({ many }) => ({
  universityCourseBookmarks: many(universityCourseBookmarks),
  learningMethods: many(learningMethods),
  learningMethodReviews: many(learningMethodReviews),
  learningTools: many(learningTools),
  learningToolReviews: many(learningToolReviews),
}));

// Update user relations to include chat messages
export const usersChatRelations = relations(users, ({ many }) => ({
  sentMessages: many(chatMessages, { relationName: "sentMessages" }),
  receivedMessages: many(chatMessages, { relationName: "receivedMessages" }),
}));

// Type definitions for chat messages
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// University Course Comments schema
export const universityCourseComments = pgTable("university_course_comments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => universityCourses.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertUniversityCourseCommentSchema = createInsertSchema(universityCourseComments).pick({
  courseId: true,
  userId: true,
  content: true,
  updatedAt: true,
});

// University Course Resources schema
export const universityCourseResources = pgTable("university_course_resources", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => universityCourses.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  resourceType: text("resource_type").notNull(), // github, documentation, video, article, certificate, other
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertUniversityCourseResourceSchema = createInsertSchema(universityCourseResources).pick({
  courseId: true,
  userId: true,
  title: true,
  url: true,
  description: true,
  resourceType: true,
  updatedAt: true,
});

// University Course Collaborations schema
export const universityCourseCollaborations = pgTable("university_course_collaborations", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => universityCourses.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  message: text("message").notNull(),
  contactMethod: text("contact_method").notNull(),
  contactDetails: text("contact_details").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertUniversityCourseCollaborationSchema = createInsertSchema(universityCourseCollaborations).pick({
  courseId: true,
  userId: true,
  message: true,
  contactMethod: true,
  contactDetails: true,
  updatedAt: true,
});

// Relations for university course comments
export const universityCourseCommentsRelations = relations(universityCourseComments, ({ one }) => ({
  course: one(universityCourses, {
    fields: [universityCourseComments.courseId],
    references: [universityCourses.id],
  }),
  user: one(users, {
    fields: [universityCourseComments.userId],
    references: [users.id],
  }),
}));

// Relations for university course resources
export const universityCourseResourcesRelations = relations(universityCourseResources, ({ one }) => ({
  course: one(universityCourses, {
    fields: [universityCourseResources.courseId],
    references: [universityCourses.id],
  }),
  user: one(users, {
    fields: [universityCourseResources.userId],
    references: [users.id],
  }),
}));

// Relations for university course collaborations
export const universityCourseCollaborationsRelations = relations(universityCourseCollaborations, ({ one }) => ({
  course: one(universityCourses, {
    fields: [universityCourseCollaborations.courseId],
    references: [universityCourses.id],
  }),
  user: one(users, {
    fields: [universityCourseCollaborations.userId],
    references: [users.id],
  }),
}));

// Update university courses relations to include comments, resources, and collaborations
export const universityCoursesRelationsExtended = relations(universityCourses, ({ many }) => ({
  bookmarks: many(universityCourseBookmarks),
  comments: many(universityCourseComments),
  resources: many(universityCourseResources),
  collaborations: many(universityCourseCollaborations),
}));

// Type definitions for university courses and learning center
export type UniversityCourse = typeof universityCourses.$inferSelect;
export type InsertUniversityCourse = typeof universityCourses.$inferInsert;

export type UniversityCourseBookmark = typeof universityCourseBookmarks.$inferSelect;
export type InsertUniversityCourseBookmark = typeof universityCourseBookmarks.$inferInsert;

export type UniversityCourseComment = typeof universityCourseComments.$inferSelect;
export type InsertUniversityCourseComment = typeof universityCourseComments.$inferInsert;

export type UniversityCourseResource = typeof universityCourseResources.$inferSelect;
export type InsertUniversityCourseResource = typeof universityCourseResources.$inferInsert;

export type UniversityCourseCollaboration = typeof universityCourseCollaborations.$inferSelect;
export type InsertUniversityCourseCollaboration = typeof universityCourseCollaborations.$inferInsert;

export type LearningMethod = typeof learningMethods.$inferSelect;
export type InsertLearningMethod = typeof learningMethods.$inferInsert;

export type LearningMethodReview = typeof learningMethodReviews.$inferSelect;
export type InsertLearningMethodReview = typeof learningMethodReviews.$inferInsert;

export type LearningTool = typeof learningTools.$inferSelect;
export type InsertLearningTool = typeof learningTools.$inferInsert;

export type LearningToolReview = typeof learningToolReviews.$inferSelect;
export type InsertLearningToolReview = typeof learningToolReviews.$inferInsert;
