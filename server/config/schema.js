import { neon } from "@neondatabase/serverless";
import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  display_name: varchar("display_name", { length: 100 }),
  profile_image: text("profile_image"),
  bio: text("bio"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  firebase_uid: varchar("firebase_uid", { length: 128 }).unique(),
  last_login: timestamp("last_login"),
  is_verified: boolean("is_verified").default(false),
});

// Messages table (direct messages)
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  sender_id: integer("sender_id")
    .references(() => users.id)
    .notNull(),
  receiver_id: integer("receiver_id")
    .references(() => users.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow(),
  is_read: boolean("is_read").default(false),
});

// User followers table (to determine who can chat with whom)
export const user_followers = pgTable(
  "user_followers",
  {
    follower_id: integer("follower_id")
      .references(() => users.id)
      .notNull(),
    followed_id: integer("followed_id")
      .references(() => users.id)
      .notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey(table.follower_id, table.followed_id),
    };
  }
);

// Chat groups table
export const chat_groups = pgTable("chat_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  creator_id: integer("creator_id")
    .references(() => users.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow(),
  image_url: text("image_url"),
});

// Group members table
export const group_members = pgTable(
  "group_members",
  {
    group_id: integer("group_id")
      .references(() => chat_groups.id)
      .notNull(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    is_admin: boolean("is_admin").default(false),
    joined_at: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey(table.group_id, table.user_id),
    };
  }
);

// Group messages table
export const group_messages = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  sender_id: integer("sender_id")
    .references(() => users.id)
    .notNull(),
  group_id: integer("group_id")
    .references(() => chat_groups.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Bookmarks table
export const bookmarks = pgTable(
  "bookmarks",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    post_id: integer("post_id").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      userPostIndex: uniqueIndex("user_post_idx").on(
        table.user_id,
        table.post_id
      ),
    };
  }
);

// Course bookmarks table
export const course_bookmarks = pgTable(
  "course_bookmarks",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    course_id: integer("course_id").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      userCourseIndex: uniqueIndex("user_course_idx").on(
        table.user_id,
        table.course_id
      ),
    };
  }
);

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  user_id: integer("user_id")
    .references(() => users.id)
    .notNull(),
  post_id: integer("post_id").notNull(),
  parent_id: integer("parent_id").references(() => comments.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow(),
});
