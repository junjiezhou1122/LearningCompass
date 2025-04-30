import { 
  User, Course, Bookmark, SearchHistory, Subscriber, Comment,
  InsertUser, InsertCourse, InsertBookmark, InsertSearchHistory, InsertSubscriber, InsertComment,
  users, courses, bookmarks, searchHistory, subscribers, comments,
  // Learning post schemas and types
  learningPosts, learningPostComments, learningPostLikes, learningPostBookmarks,
  LearningPost, InsertLearningPost, LearningPostComment, InsertLearningPostComment,
  LearningPostLike, InsertLearningPostLike, LearningPostBookmark, InsertLearningPostBookmark
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc, asc, sql, or, inArray, arrayContains } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getCourses(options?: { 
    limit?: number;
    offset?: number;
    category?: string;
    subCategory?: string;
    courseType?: string;
    language?: string;
    rating?: number;
    sortBy?: string;
    search?: string;
  }): Promise<Course[]>;
  getCoursesCount(options?: { 
    category?: string;
    subCategory?: string;
    courseType?: string;
    language?: string;
    rating?: number;
    search?: string;
  }): Promise<number>;
  getCoursesByIds(ids: number[]): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  getCategories(): Promise<string[]>;
  getSubCategories(): Promise<string[]>;
  getCourseTypes(): Promise<string[]>;
  getLanguages(): Promise<string[]>;
  getSkills(): Promise<string[]>;
  
  // Bookmark operations
  getBookmark(userId: number, courseId: number): Promise<Bookmark | undefined>;
  getBookmarksByUserId(userId: number): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(userId: number, courseId: number): Promise<boolean>;
  
  // Search history operations
  createSearchHistory(searchHistory: InsertSearchHistory): Promise<SearchHistory>;
  getSearchHistoryByUserId(userId: number): Promise<SearchHistory[]>;
  
  // Subscriber operations
  getSubscriberByEmail(email: string): Promise<Subscriber | undefined>;
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  getAllSubscribers(): Promise<Subscriber[]>;
  
  // Comment operations
  getCommentsByCourseId(courseId: number): Promise<Comment[]>;
  getCommentById(id: number): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, content: string, rating?: number): Promise<Comment | undefined>;
  deleteComment(id: number, userId: number): Promise<boolean>;
  
  // Learning post operations
  getLearningPost(id: number): Promise<LearningPost | undefined>;
  getLearningPosts(options?: {
    limit?: number;
    offset?: number;
    type?: string;
    tag?: string;
    userId?: number;
  }): Promise<LearningPost[]>;
  createLearningPost(post: InsertLearningPost): Promise<LearningPost>;
  updateLearningPost(id: number, post: Partial<InsertLearningPost>): Promise<LearningPost | undefined>;
  deleteLearningPost(id: number, userId: number): Promise<boolean>;
  incrementLearningPostViews(id: number): Promise<void>;
  
  // Learning post comment operations
  getLearningPostComment(id: number): Promise<LearningPostComment | undefined>;
  getLearningPostCommentsByPostId(postId: number): Promise<LearningPostComment[]>;
  getLearningPostCommentsCount(postId: number): Promise<number>;
  createLearningPostComment(comment: InsertLearningPostComment): Promise<LearningPostComment>;
  updateLearningPostComment(id: number, content: string): Promise<LearningPostComment | undefined>;
  deleteLearningPostComment(id: number, userId: number): Promise<boolean>;
  
  // Learning post like operations
  getLearningPostLike(postId: number, userId: number): Promise<LearningPostLike | undefined>;
  getLearningPostLikesByPostId(postId: number): Promise<LearningPostLike[]>;
  createLearningPostLike(like: InsertLearningPostLike): Promise<LearningPostLike>;
  deleteLearningPostLike(postId: number, userId: number): Promise<boolean>;
  getLearningPostLikesCount(postId: number): Promise<number>;
  
  // Learning post bookmark operations
  getLearningPostBookmark(postId: number, userId: number): Promise<LearningPostBookmark | undefined>;
  getLearningPostBookmarksByUserId(userId: number): Promise<LearningPostBookmark[]>;
  createLearningPostBookmark(bookmark: InsertLearningPostBookmark): Promise<LearningPostBookmark>;
  deleteLearningPostBookmark(postId: number, userId: number): Promise<boolean>;
  
  // Learning post tag operations
  getLearningPostTags(): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async getCourses(options?: { 
    limit?: number;
    offset?: number;
    category?: string;
    subCategory?: string;
    courseType?: string;
    language?: string;
    rating?: number;
    sortBy?: string;
    search?: string;
  }): Promise<Course[]> {
    let query = db.select().from(courses);
    
    // Apply filters
    const whereConditions = [];
    
    if (options?.category) {
      whereConditions.push(eq(courses.category, options.category));
    }
    
    if (options?.subCategory) {
      whereConditions.push(eq(courses.subCategory, options.subCategory));
    }
    
    if (options?.courseType) {
      whereConditions.push(eq(courses.courseType, options.courseType));
    }
    
    if (options?.language) {
      whereConditions.push(eq(courses.language, options.language));
    }
    
    if (options?.rating && courses.rating) {
      whereConditions.push(sql`${courses.rating} >= ${options.rating}`);
    }
    
    if (options?.search) {
      whereConditions.push(
        or(
          like(courses.title, `%${options.search}%`),
          sql`${courses.shortIntro} LIKE ${'%' + options.search + '%'}`,
          sql`${courses.skills} LIKE ${'%' + options.search + '%'}`
        )
      );
    }
    
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }
    
    // Apply sorting
    if (options?.sortBy) {
      switch (options.sortBy) {
        case 'rating_high':
          query = query.orderBy(desc(courses.rating));
          break;
        case 'rating_low':
          query = query.orderBy(asc(courses.rating));
          break;
        case 'popular':
          query = query.orderBy(desc(courses.numberOfViewers));
          break;
        default:
          // Default sorting (recommended)
          query = query.orderBy(desc(courses.rating));
      }
    } else {
      // Default sorting
      query = query.orderBy(desc(courses.rating));
    }
    
    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }

  async getCoursesCount(options?: { 
    category?: string;
    subCategory?: string;
    courseType?: string;
    language?: string;
    rating?: number;
    search?: string;
  }): Promise<number> {
    let query = db.select({ count: sql`count(*)` }).from(courses);
    
    // Apply filters
    const whereConditions = [];
    
    if (options?.category) {
      whereConditions.push(eq(courses.category, options.category));
    }
    
    if (options?.subCategory) {
      whereConditions.push(eq(courses.subCategory, options.subCategory));
    }
    
    if (options?.courseType) {
      whereConditions.push(eq(courses.courseType, options.courseType));
    }
    
    if (options?.language) {
      whereConditions.push(eq(courses.language, options.language));
    }
    
    if (options?.rating && courses.rating) {
      whereConditions.push(sql`${courses.rating} >= ${options.rating}`);
    }
    
    if (options?.search) {
      whereConditions.push(
        or(
          like(courses.title, `%${options.search}%`),
          sql`${courses.shortIntro} LIKE ${'%' + options.search + '%'}`,
          sql`${courses.skills} LIKE ${'%' + options.search + '%'}`
        )
      );
    }
    
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }
    
    const result = await query;
    return Number(result[0]?.count || 0);
  }

  async getCoursesByIds(ids: number[]): Promise<Course[]> {
    if (ids.length === 0) return [];
    return await db.select().from(courses).where(inArray(courses.id, ids));
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }

  async getCategories(): Promise<string[]> {
    const result = await db.select({ category: courses.category }).from(courses)
      .where(sql`${courses.category} IS NOT NULL`)
      .groupBy(courses.category);
    return result.map(r => r.category || '').filter(c => c !== '');
  }

  async getSubCategories(): Promise<string[]> {
    const result = await db.select({ subCategory: courses.subCategory }).from(courses)
      .where(sql`${courses.subCategory} IS NOT NULL`)
      .groupBy(courses.subCategory);
    return result.map(r => r.subCategory || '').filter(c => c !== '');
  }

  async getCourseTypes(): Promise<string[]> {
    const result = await db.select({ courseType: courses.courseType }).from(courses)
      .where(sql`${courses.courseType} IS NOT NULL`)
      .groupBy(courses.courseType);
    return result.map(r => r.courseType || '').filter(c => c !== '');
  }

  async getLanguages(): Promise<string[]> {
    const result = await db.select({ language: courses.language }).from(courses)
      .where(sql`${courses.language} IS NOT NULL`)
      .groupBy(courses.language);
    return result.map(r => r.language || '').filter(c => c !== '');
  }

  async getSkills(): Promise<string[]> {
    const result = await db.select({ skills: courses.skills }).from(courses)
      .where(sql`${courses.skills} IS NOT NULL`);
    
    // Extract and deduplicate skills
    const skillSet = new Set<string>();
    result.forEach(r => {
      if (r.skills) {
        r.skills.split(',').map(s => s.trim()).forEach(skill => {
          if (skill) skillSet.add(skill);
        });
      }
    });
    
    return Array.from(skillSet);
  }

  async getBookmark(userId: number, courseId: number): Promise<Bookmark | undefined> {
    const [bookmark] = await db.select().from(bookmarks)
      .where(and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.courseId, courseId)
      ));
    return bookmark || undefined;
  }

  async getBookmarksByUserId(userId: number): Promise<Bookmark[]> {
    return await db.select().from(bookmarks).where(eq(bookmarks.userId, userId));
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const [bookmark] = await db.insert(bookmarks).values(insertBookmark).returning();
    return bookmark;
  }

  async deleteBookmark(userId: number, courseId: number): Promise<boolean> {
    await db.delete(bookmarks)
      .where(and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.courseId, courseId)
      ));
    return true; // Drizzle doesn't have an easy way to check affected rows, so assuming success
  }

  async createSearchHistory(insertSearchHistory: InsertSearchHistory): Promise<SearchHistory> {
    const [result] = await db.insert(searchHistory).values(insertSearchHistory).returning();
    return result;
  }

  async getSearchHistoryByUserId(userId: number): Promise<SearchHistory[]> {
    return await db.select().from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.createdAt))
      .limit(200); // Limit to 200 most recent searches
  }

  // Subscriber operations
  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    const [subscriber] = await db.select().from(subscribers).where(eq(subscribers.email, email));
    return subscriber || undefined;
  }

  async createSubscriber(insertSubscriber: InsertSubscriber): Promise<Subscriber> {
    // Set default values before inserting
    const subscriber = {
      ...insertSubscriber,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    const [result] = await db.insert(subscribers).values(subscriber).returning();
    return result;
  }

  async getAllSubscribers(): Promise<Subscriber[]> {
    return await db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
  }
  
  // Comment operations
  async getCommentsByCourseId(courseId: number): Promise<Comment[]> {
    return await db.select().from(comments)
      .where(eq(comments.courseId, courseId))
      .orderBy(desc(comments.createdAt));
  }
  
  async getCommentById(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment || undefined;
  }
  
  async createComment(insertComment: InsertComment): Promise<Comment> {
    // Ensure createdAt is properly set
    const comment = {
      ...insertComment,
      createdAt: insertComment.createdAt || new Date().toISOString()
    };
    
    const [result] = await db.insert(comments).values(comment).returning();
    return result;
  }
  
  async updateComment(id: number, content: string, rating?: number): Promise<Comment | undefined> {
    // First check if comment exists
    const existingComment = await this.getCommentById(id);
    if (!existingComment) {
      return undefined;
    }
    
    // Prepare update data
    const updateData: Partial<Comment> = {
      content,
      updatedAt: new Date().toISOString()
    };
    
    if (rating !== undefined) {
      updateData.rating = rating;
    }
    
    // Update comment
    const [updated] = await db.update(comments)
      .set(updateData)
      .where(eq(comments.id, id))
      .returning();
      
    return updated;
  }
  
  async deleteComment(id: number, userId: number): Promise<boolean> {
    // First check if comment exists and belongs to the user
    const [comment] = await db.select().from(comments)
      .where(and(
        eq(comments.id, id),
        eq(comments.userId, userId)
      ));
      
    if (!comment) {
      return false;
    }
    
    // Delete comment
    await db.delete(comments).where(eq(comments.id, id));
    return true;
  }

  // Learning post operations
  async getLearningPost(id: number): Promise<LearningPost | undefined> {
    const [post] = await db.select().from(learningPosts).where(eq(learningPosts.id, id));
    return post || undefined;
  }

  async getLearningPosts(options?: {
    limit?: number;
    offset?: number;
    type?: string;
    tag?: string;
    userId?: number;
  }): Promise<LearningPost[]> {
    let query = db.select().from(learningPosts);
    
    // Apply filters
    const whereConditions = [];
    
    if (options?.type) {
      whereConditions.push(eq(learningPosts.type, options.type));
    }
    
    if (options?.tag) {
      whereConditions.push(arrayContains(learningPosts.tags, [options.tag]));
    }
    
    if (options?.userId) {
      whereConditions.push(eq(learningPosts.userId, options.userId));
    }
    
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }
    
    // Order by most recent
    query = query.orderBy(desc(learningPosts.createdAt));
    
    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }

  async createLearningPost(insertPost: InsertLearningPost): Promise<LearningPost> {
    const [post] = await db.insert(learningPosts).values(insertPost).returning();
    return post;
  }

  async updateLearningPost(id: number, post: Partial<InsertLearningPost>): Promise<LearningPost | undefined> {
    const [updatedPost] = await db.update(learningPosts)
      .set({
        ...post,
        updatedAt: new Date()
      })
      .where(eq(learningPosts.id, id))
      .returning();
    return updatedPost || undefined;
  }

  async deleteLearningPost(id: number, userId: number): Promise<boolean> {
    // First, ensure the post exists and belongs to the user
    const [post] = await db.select().from(learningPosts)
      .where(and(
        eq(learningPosts.id, id),
        eq(learningPosts.userId, userId)
      ));
    
    if (!post) return false;
    
    // Delete all associated data first
    await db.delete(learningPostLikes).where(eq(learningPostLikes.postId, id));
    await db.delete(learningPostComments).where(eq(learningPostComments.postId, id));
    await db.delete(learningPostBookmarks).where(eq(learningPostBookmarks.postId, id));
    
    // Then delete the post
    await db.delete(learningPosts).where(eq(learningPosts.id, id));
    return true;
  }
  
  async incrementLearningPostViews(id: number): Promise<void> {
    await db.update(learningPosts)
      .set({ 
        views: sql`${learningPosts.views} + 1` 
      })
      .where(eq(learningPosts.id, id));
  }

  // Learning post comment operations
  async getLearningPostComment(id: number): Promise<LearningPostComment | undefined> {
    const [comment] = await db.select().from(learningPostComments).where(eq(learningPostComments.id, id));
    return comment || undefined;
  }

  async getLearningPostCommentsByPostId(postId: number): Promise<LearningPostComment[]> {
    return await db.select().from(learningPostComments)
      .where(eq(learningPostComments.postId, postId))
      .orderBy(asc(learningPostComments.createdAt));
  }
  
  async getLearningPostCommentsCount(postId: number): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(learningPostComments)
      .where(eq(learningPostComments.postId, postId));
    return Number(result[0]?.count || 0);
  }

  async createLearningPostComment(insertComment: InsertLearningPostComment): Promise<LearningPostComment> {
    const [comment] = await db.insert(learningPostComments).values(insertComment).returning();
    return comment;
  }

  async updateLearningPostComment(id: number, content: string): Promise<LearningPostComment | undefined> {
    const [updatedComment] = await db.update(learningPostComments)
      .set({
        content,
        updatedAt: new Date()
      })
      .where(eq(learningPostComments.id, id))
      .returning();
    return updatedComment || undefined;
  }

  async deleteLearningPostComment(id: number, userId: number): Promise<boolean> {
    await db.delete(learningPostComments)
      .where(and(
        eq(learningPostComments.id, id),
        eq(learningPostComments.userId, userId)
      ));
    return true;
  }

  // Learning post like operations
  async getLearningPostLike(postId: number, userId: number): Promise<LearningPostLike | undefined> {
    const [like] = await db.select().from(learningPostLikes)
      .where(and(
        eq(learningPostLikes.postId, postId),
        eq(learningPostLikes.userId, userId)
      ));
    return like || undefined;
  }

  async getLearningPostLikesByPostId(postId: number): Promise<LearningPostLike[]> {
    return await db.select().from(learningPostLikes)
      .where(eq(learningPostLikes.postId, postId));
  }

  async createLearningPostLike(insertLike: InsertLearningPostLike): Promise<LearningPostLike> {
    const [like] = await db.insert(learningPostLikes).values(insertLike).returning();
    return like;
  }

  async deleteLearningPostLike(postId: number, userId: number): Promise<boolean> {
    await db.delete(learningPostLikes)
      .where(and(
        eq(learningPostLikes.postId, postId),
        eq(learningPostLikes.userId, userId)
      ));
    return true;
  }

  async getLearningPostLikesCount(postId: number): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(learningPostLikes)
      .where(eq(learningPostLikes.postId, postId));
    return Number(result[0]?.count || 0);
  }

  // Learning post bookmark operations
  async getLearningPostBookmark(postId: number, userId: number): Promise<LearningPostBookmark | undefined> {
    const [bookmark] = await db.select().from(learningPostBookmarks)
      .where(and(
        eq(learningPostBookmarks.postId, postId),
        eq(learningPostBookmarks.userId, userId)
      ));
    return bookmark || undefined;
  }

  async getLearningPostBookmarksByUserId(userId: number): Promise<LearningPostBookmark[]> {
    return await db.select().from(learningPostBookmarks)
      .where(eq(learningPostBookmarks.userId, userId));
  }

  async createLearningPostBookmark(insertBookmark: InsertLearningPostBookmark): Promise<LearningPostBookmark> {
    const [bookmark] = await db.insert(learningPostBookmarks).values(insertBookmark).returning();
    return bookmark;
  }

  async deleteLearningPostBookmark(postId: number, userId: number): Promise<boolean> {
    await db.delete(learningPostBookmarks)
      .where(and(
        eq(learningPostBookmarks.postId, postId),
        eq(learningPostBookmarks.userId, userId)
      ));
    return true;
  }

  // Learning post tag operations
  async getLearningPostTags(): Promise<string[]> {
    const result = await db.select({ tags: learningPosts.tags }).from(learningPosts)
      .where(sql`${learningPosts.tags} IS NOT NULL`);
    
    // Extract and deduplicate tags
    const tagSet = new Set<string>();
    result.forEach(r => {
      if (r.tags && r.tags.length > 0) {
        r.tags.forEach(tag => {
          if (tag) tagSet.add(tag);
        });
      }
    });
    
    return Array.from(tagSet);
  }
}

export const storage = new DatabaseStorage();