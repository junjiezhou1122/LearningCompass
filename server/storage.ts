import {
  User,
  Course,
  Bookmark,
  SearchHistory,
  Subscriber,
  Comment,
  InsertUser,
  InsertCourse,
  InsertBookmark,
  InsertSearchHistory,
  InsertSubscriber,
  InsertComment,
  users,
  courses,
  bookmarks,
  searchHistory,
  subscribers,
  comments,
  // Learning post schemas and types
  learningPosts,
  learningPostComments,
  learningPostLikes,
  learningPostBookmarks,
  LearningPost,
  InsertLearningPost,
  LearningPostComment,
  InsertLearningPostComment,
  LearningPostLike,
  InsertLearningPostLike,
  LearningPostBookmark,
  InsertLearningPostBookmark,
  // User follows schemas and types
  userFollows,
  UserFollow,
  InsertUserFollow,
  // AI conversations schemas and types
  aiConversations,
  AiConversation,
  InsertAiConversation,
  // Method applications schemas and types
  methodApplications,
  MethodApplication,
  InsertMethodApplication,
  // Gamification schemas and types
  userGamification,
  userBadges,
  userRecommendations,
  UserGamification,
  InsertUserGamification,
  UserBadge,
  InsertUserBadge,
  UserRecommendation,
  InsertUserRecommendation,
  // User events schemas and types
  userEvents,
  UserEvent,
  InsertUserEvent,
  // User notes schemas and types
  userNotes,
  UserNote,
  InsertUserNote,
  // Chat messages schemas and types
  chatMessages,
  ChatMessage,
  InsertChatMessage,
  // Learning Center - University Courses
  universityCourses,
  universityCourseBookmarks,
  universityCourseLinks,
  universityCourseComments,
  universityCourseResources,
  universityCourseCollaborations,
  UniversityCourse,
  InsertUniversityCourse,
  UniversityCourseBookmark,
  InsertUniversityCourseBookmark,
  UniversityCourseComment,
  InsertUniversityCourseComment,
  UniversityCourseResource,
  InsertUniversityCourseResource,
  UniversityCourseCollaboration,
  InsertUniversityCourseCollaboration,
  UniversityCourseLink,
  InsertUniversityCourseLink,
  // Learning Center - Learning Methods and Tools
  learningMethods,
  learningMethodReviews,
  learningMethodComments,
  LearningMethod,
  InsertLearningMethod,
  LearningMethodReview,
  InsertLearningMethodReview,
  LearningMethodComment,
  InsertLearningMethodComment,
  learningTools,
  learningToolReviews,
  LearningTool,
  InsertLearningTool,
  LearningToolReview,
  InsertLearningToolReview,
} from "@shared/schema";
import { db } from "./db";
import {
  eq,
  and,
  like,
  desc,
  asc,
  sql,
  or,
  inArray,
  arrayContains,
  count,
} from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseId(firebaseId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserPosts(userId: number): Promise<LearningPost[]>;

  // Follow operations
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;
  getFollowersCount(userId: number): Promise<number>;
  getFollowingCount(userId: number): Promise<number>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  createFollow(follow: InsertUserFollow): Promise<UserFollow>;
  deleteFollow(followerId: number, followingId: number): Promise<boolean>;

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
  createSearchHistory(
    searchHistory: InsertSearchHistory
  ): Promise<SearchHistory>;
  getSearchHistoryByUserId(userId: number): Promise<SearchHistory[]>;

  // Subscriber operations
  getSubscriberByEmail(email: string): Promise<Subscriber | undefined>;
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  getAllSubscribers(): Promise<Subscriber[]>;

  // Comment operations
  getCommentsByCourseId(courseId: number): Promise<Comment[]>;
  getCommentById(id: number): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(
    id: number,
    content: string,
    rating?: number
  ): Promise<Comment | undefined>;
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
  updateLearningPost(
    id: number,
    post: Partial<InsertLearningPost>
  ): Promise<LearningPost | undefined>;
  deleteLearningPost(id: number, userId: number): Promise<boolean>;
  incrementLearningPostViews(id: number): Promise<void>;

  // Learning post comment operations
  getLearningPostComment(id: number): Promise<LearningPostComment | undefined>;
  getLearningPostCommentsByPostId(
    postId: number
  ): Promise<LearningPostComment[]>;
  getLearningPostCommentsByUserId(
    userId: number
  ): Promise<LearningPostComment[]>;
  getLearningPostCommentsCount(postId: number): Promise<number>;
  createLearningPostComment(
    comment: InsertLearningPostComment
  ): Promise<LearningPostComment>;
  updateLearningPostComment(
    id: number,
    content: string
  ): Promise<LearningPostComment | undefined>;
  deleteLearningPostComment(id: number, userId: number): Promise<boolean>;

  // Learning post like operations
  getLearningPostLike(
    postId: number,
    userId: number
  ): Promise<LearningPostLike | undefined>;
  getLearningPostLikesByPostId(postId: number): Promise<LearningPostLike[]>;
  getLearningPostLikesByUserId(userId: number): Promise<LearningPostLike[]>;
  createLearningPostLike(
    like: InsertLearningPostLike
  ): Promise<LearningPostLike>;
  deleteLearningPostLike(postId: number, userId: number): Promise<boolean>;
  getLearningPostLikesCount(postId: number): Promise<number>;

  // Learning post bookmark operations
  getLearningPostBookmark(
    postId: number,
    userId: number
  ): Promise<LearningPostBookmark | undefined>;
  getLearningPostBookmarksByUserId(
    userId: number
  ): Promise<LearningPostBookmark[]>;
  createLearningPostBookmark(
    bookmark: InsertLearningPostBookmark
  ): Promise<LearningPostBookmark>;
  deleteLearningPostBookmark(postId: number, userId: number): Promise<boolean>;

  // Learning post tag operations
  getLearningPostTags(): Promise<string[]>;

  // AI conversation operations
  getAiConversation(id: number): Promise<AiConversation | undefined>;
  getAiConversationsByUserId(userId: number): Promise<AiConversation[]>;
  createAiConversation(
    conversation: InsertAiConversation
  ): Promise<AiConversation>;
  updateAiConversation(
    id: number,
    data: Partial<InsertAiConversation>
  ): Promise<AiConversation | undefined>;
  deleteAiConversation(id: number, userId: number): Promise<boolean>;

  // Method application operations
  getMethodApplication(id: number): Promise<MethodApplication | undefined>;
  getMethodApplicationsByUserId(userId: number): Promise<MethodApplication[]>;
  getMethodApplicationsByMethodId(
    methodPostId: number
  ): Promise<MethodApplication[]>;
  getMethodApplicationByUserAndMethod(
    userId: number,
    methodPostId: number
  ): Promise<MethodApplication | undefined>;
  createMethodApplication(
    application: InsertMethodApplication
  ): Promise<MethodApplication>;
  updateMethodApplication(
    id: number,
    data: Partial<InsertMethodApplication>
  ): Promise<MethodApplication | undefined>;
  deleteMethodApplication(id: number, userId: number): Promise<boolean>;
  getActiveMethodApplicationsByUserId(
    userId: number
  ): Promise<MethodApplication[]>;
  getCompletedMethodApplicationsByUserId(
    userId: number
  ): Promise<MethodApplication[]>;
  getMethodApplicationsCount(methodPostId: number): Promise<number>;

  // Gamification operations
  getUserGamification(userId: number): Promise<UserGamification | undefined>;
  createUserGamification(
    gamification: InsertUserGamification
  ): Promise<UserGamification>;
  updateUserGamification(
    userId: number,
    data: Partial<InsertUserGamification>
  ): Promise<UserGamification | undefined>;
  addUserPoints(
    userId: number,
    points: number
  ): Promise<UserGamification | undefined>;
  incrementUserStreak(userId: number): Promise<UserGamification | undefined>;

  // User badges operations
  getUserBadges(userId: number): Promise<UserBadge[]>;
  createUserBadge(badge: InsertUserBadge): Promise<UserBadge>;

  // Recommendations operations
  getUserRecommendations(
    userId: number,
    limit?: number
  ): Promise<(UserRecommendation & { course: Course })[]>;
  createUserRecommendation(
    recommendation: InsertUserRecommendation
  ): Promise<UserRecommendation>;
  updateUserRecommendation(
    id: number,
    data: Partial<InsertUserRecommendation>
  ): Promise<UserRecommendation | undefined>;
  generateRecommendations(
    userId: number
  ): Promise<(UserRecommendation & { course: Course })[]>;

  // User Events operations
  getUserEvent(id: number): Promise<UserEvent | undefined>;
  getUserEvents(
    userId: number,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      upcoming?: boolean;
      eventType?: string;
    }
  ): Promise<UserEvent[]>;
  createUserEvent(event: InsertUserEvent): Promise<UserEvent>;
  updateUserEvent(
    id: number,
    event: Partial<InsertUserEvent>
  ): Promise<UserEvent | undefined>;
  deleteUserEvent(id: number, userId: number): Promise<boolean>;
  getEventsByDateRange(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<UserEvent[]>;
  getUpcomingEvents(userId: number, limit?: number): Promise<UserEvent[]>;

  // User Notes operations
  getUserNote(id: number): Promise<UserNote | undefined>;
  getUserNotes(
    userId: number,
    options?: {
      limit?: number;
      offset?: number;
      tag?: string;
      courseId?: number;
      isPinned?: boolean;
    }
  ): Promise<UserNote[]>;
  createUserNote(note: InsertUserNote): Promise<UserNote>;
  updateUserNote(
    id: number,
    note: Partial<InsertUserNote>
  ): Promise<UserNote | undefined>;
  deleteUserNote(id: number, userId: number): Promise<boolean>;
  getUserNoteTags(userId: number): Promise<string[]>;

  // University Courses operations
  getUniversityCourse(id: number): Promise<UniversityCourse | undefined>;
  getUniversityCourses(options?: {
    limit?: number;
    offset?: number;
    university?: string;
    courseDept?: string;
    search?: string;
  }): Promise<UniversityCourse[]>;
  getUniversityCoursesCount(options?: {
    university?: string;
    courseDept?: string;
    search?: string;
  }): Promise<number>;
  getUniversityCourseByDeptAndNumber(
    university: string,
    courseDept: string,
    courseNumber: string
  ): Promise<UniversityCourse | undefined>;
  createUniversityCourse(
    course: InsertUniversityCourse
  ): Promise<UniversityCourse>;
  updateUniversityCourse(
    id: number,
    course: Partial<InsertUniversityCourse>
  ): Promise<UniversityCourse | undefined>;
  getUniversities(): Promise<string[]>;
  getCourseDepartments(university?: string): Promise<string[]>;

  // University Course Bookmark operations
  getUniversityCourseBookmark(
    userId: number,
    courseId: number
  ): Promise<UniversityCourseBookmark | undefined>;
  getUniversityCourseBookmarksByUserId(
    userId: number
  ): Promise<UniversityCourseBookmark[]>;
  createUniversityCourseBookmark(
    bookmark: InsertUniversityCourseBookmark
  ): Promise<UniversityCourseBookmark>;
  deleteUniversityCourseBookmark(
    userId: number,
    courseId: number
  ): Promise<boolean>;

  // University Course Links operations
  getUniversityCourseLink(
    id: number
  ): Promise<UniversityCourseLink | undefined>;
  getUniversityCourseLinksByCourseId(
    courseId: number
  ): Promise<UniversityCourseLink[]>;
  createUniversityCourseLink(
    link: InsertUniversityCourseLink
  ): Promise<UniversityCourseLink>;
  updateUniversityCourseLink(
    id: number,
    link: Partial<InsertUniversityCourseLink>
  ): Promise<UniversityCourseLink | undefined>;
  deleteUniversityCourseLink(id: number): Promise<boolean>;

  // University Course Comments operations
  getUniversityCourseComment(
    id: number
  ): Promise<UniversityCourseComment | undefined>;
  getUniversityCourseCommentsByCourseId(
    courseId: number
  ): Promise<UniversityCourseComment[]>;
  createUniversityCourseComment(
    comment: InsertUniversityCourseComment
  ): Promise<UniversityCourseComment>;
  updateUniversityCourseComment(
    id: number,
    content: string
  ): Promise<UniversityCourseComment | undefined>;
  deleteUniversityCourseComment(id: number, userId: number): Promise<boolean>;

  // University Course Resources operations
  getUniversityCourseResource(
    id: number
  ): Promise<UniversityCourseResource | undefined>;
  getUniversityCourseResourcesByCourseId(
    courseId: number
  ): Promise<UniversityCourseResource[]>;
  createUniversityCourseResource(
    resource: InsertUniversityCourseResource
  ): Promise<UniversityCourseResource>;
  updateUniversityCourseResource(
    id: number,
    resource: Partial<InsertUniversityCourseResource>
  ): Promise<UniversityCourseResource | undefined>;
  deleteUniversityCourseResource(id: number, userId: number): Promise<boolean>;

  // University Course Collaborations operations
  getUniversityCourseCollaboration(
    id: number
  ): Promise<UniversityCourseCollaboration | undefined>;
  getUniversityCourseCollaborationsByCourseId(
    courseId: number
  ): Promise<UniversityCourseCollaboration[]>;
  getUniversityCourseCollaborationsByUserId(
    userId: number
  ): Promise<UniversityCourseCollaboration[]>;
  createUniversityCourseCollaboration(
    collaboration: InsertUniversityCourseCollaboration
  ): Promise<UniversityCourseCollaboration>;
  deleteUniversityCourseCollaboration(
    id: number,
    userId: number
  ): Promise<boolean>;

  // Learning Methods operations
  getLearningMethod(id: number): Promise<LearningMethod | undefined>;
  getLearningMethods(options?: {
    limit?: number;
    offset?: number;
    userId?: number;
    difficulty?: string;
    tag?: string;
    search?: string;
  }): Promise<LearningMethod[]>;
  createLearningMethod(method: InsertLearningMethod): Promise<LearningMethod>;
  updateLearningMethod(
    id: number,
    method: Partial<InsertLearningMethod>
  ): Promise<LearningMethod | undefined>;
  deleteLearningMethod(id: number, userId: number): Promise<boolean>;
  incrementLearningMethodViews(id: number): Promise<void>;
  incrementLearningMethodUpvotes(id: number): Promise<void>;
  getLearningMethodTags(): Promise<string[]>;

  // Learning Method Comments operations
  getLearningMethodComment(
    id: number
  ): Promise<LearningMethodComment | undefined>;
  getLearningMethodCommentsByMethodId(
    methodId: number
  ): Promise<LearningMethodComment[]>;
  createLearningMethodComment(
    comment: InsertLearningMethodComment
  ): Promise<LearningMethodComment>;
  updateLearningMethodComment(
    id: number,
    comment: Partial<InsertLearningMethodComment>
  ): Promise<LearningMethodComment | undefined>;
  deleteLearningMethodComment(id: number, userId: number): Promise<boolean>;

  // Learning Method Reviews operations
  getLearningMethodReview(
    id: number
  ): Promise<LearningMethodReview | undefined>;
  getLearningMethodReviewsByMethodId(
    methodId: number
  ): Promise<LearningMethodReview[]>;
  createLearningMethodReview(
    review: InsertLearningMethodReview
  ): Promise<LearningMethodReview>;
  updateLearningMethodReview(
    id: number,
    review: Partial<InsertLearningMethodReview>
  ): Promise<LearningMethodReview | undefined>;
  deleteLearningMethodReview(id: number, userId: number): Promise<boolean>;

  // Learning Tools operations
  getLearningTool(id: number): Promise<LearningTool | undefined>;
  getLearningTools(options?: {
    limit?: number;
    offset?: number;
    userId?: number;
    category?: string;
    pricing?: string;
    search?: string;
  }): Promise<LearningTool[]>;
  createLearningTool(tool: InsertLearningTool): Promise<LearningTool>;
  updateLearningTool(
    id: number,
    tool: Partial<InsertLearningTool>
  ): Promise<LearningTool | undefined>;
  deleteLearningTool(id: number, userId: number): Promise<boolean>;
  incrementLearningToolViews(id: number): Promise<void>;
  incrementLearningToolUpvotes(id: number): Promise<void>;
  getLearningToolCategories(): Promise<string[]>;

  // Learning Tool Reviews operations
  getLearningToolReview(id: number): Promise<LearningToolReview | undefined>;
  getLearningToolReviewsByToolId(toolId: number): Promise<LearningToolReview[]>;
  createLearningToolReview(
    review: InsertLearningToolReview
  ): Promise<LearningToolReview>;
  updateLearningToolReview(
    id: number,
    review: Partial<InsertLearningToolReview>
  ): Promise<LearningToolReview | undefined>;
  deleteLearningToolReview(id: number, userId: number): Promise<boolean>;

  // Chat Messages operations
  getChatMessage(id: number): Promise<ChatMessage | undefined>;
  getChatMessagesBetweenUsers(
    userId1: number,
    userId2: number,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<ChatMessage[]>;
  getChatHistory(
    userId1: number,
    userId2: number,
    limit?: number,
    before?: number
  ): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markChatMessagesAsRead(
    senderId: number,
    receiverId: number
  ): Promise<boolean>;
  getUnreadMessageCount(userId: number): Promise<number>;
  getUnreadMessagesForUser(userId: number): Promise<ChatMessage[]>;
  getChatPartners(userId: number): Promise<User[]>;
  canUsersChat(userId1: number, userId2: number): Promise<boolean>;

  // Import online courses directly from parsed CSV data
  importOnlineCoursesFromParsedCSV(
    records: any[],
    userId: number
  ): Promise<number>;

  // Import university courses directly from parsed CSV data
  importUniversityCoursesFromParsedCSV(
    records: any[],
    userId: number
  ): Promise<{
    importedCount: number;
    warnings: string[];
    failedRecords: Array<{ record: any; error: string }>;
    totalRecords: number;
  }>;

  // In the interface definition add:
  getRecentChatPartners(userId: number): Promise<number[]>;

  // Group Chat Messages operations
  createGroupChatMessage(message: {
    senderId: number;
    groupId: number;
    content: string;
    createdAt: Date;
    status?: string;
  }): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // Add the getClient method to get a client from the pool
  private async getClient() {
    try {
      console.log("Getting database client from pool");
      const { pool } = await import("./db");

      if (!pool) {
        console.error("Database pool is not initialized");
        throw new Error("Database pool is not initialized");
      }

      const client = await pool.connect();
      console.log("Successfully obtained database client from pool");
      return client;
    } catch (error) {
      console.error("Error connecting to database:", error);
      // Try to provide more detailed error information
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}, Message: ${error.message}`);
        if (error.stack) {
          console.error("Stack trace:", error.stack);
        }
      }
      throw error;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    try {
      // First try to find by firebaseId
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.firebaseId, firebaseId));

      // If not found, try to find by providerId
      if (!user) {
        [user] = await db
          .select()
          .from(users)
          .where(eq(users.providerId, firebaseId));
      }

      return user || undefined;
    } catch (error) {
      console.error("Error fetching user by Firebase ID:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserPosts(userId: number): Promise<LearningPost[]> {
    return await db
      .select()
      .from(learningPosts)
      .where(eq(learningPosts.userId, userId))
      .orderBy(desc(learningPosts.createdAt));
  }

  async getFollowers(userId: number): Promise<User[]> {
    const followers = await db
      .select({
        user: users,
      })
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followerId, users.id))
      .where(eq(userFollows.followingId, userId));

    return followers.map((f) => f.user);
  }

  async getFollowing(userId: number): Promise<User[]> {
    const following = await db
      .select({
        user: users,
      })
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followingId, users.id))
      .where(eq(userFollows.followerId, userId));

    return following.map((f) => f.user);
  }

  async getFollowersCount(userId: number): Promise<number> {
    const result = await db
      .select({
        count: sql`count(*)`,
      })
      .from(userFollows)
      .where(eq(userFollows.followingId, userId));

    return Number(result[0]?.count || 0);
  }

  async getFollowingCount(userId: number): Promise<number> {
    const result = await db
      .select({
        count: sql`count(*)`,
      })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));

    return Number(result[0]?.count || 0);
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const [relation] = await db
      .select()
      .from(userFollows)
      .where(
        and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        )
      );

    return !!relation;
  }

  async createFollow(follow: InsertUserFollow): Promise<UserFollow> {
    // Check if already following
    const existing = await this.isFollowing(
      follow.followerId,
      follow.followingId
    );
    if (existing) {
      throw new Error("Already following this user");
    }

    const [result] = await db.insert(userFollows).values(follow).returning();

    return result;
  }

  async deleteFollow(
    followerId: number,
    followingId: number
  ): Promise<boolean> {
    const result = await db
      .delete(userFollows)
      .where(
        and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        )
      );

    return result.rowCount ? result.rowCount > 0 : false;
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
          sql`${courses.shortIntro} LIKE ${"%" + options.search + "%"}`,
          sql`${courses.skills} LIKE ${"%" + options.search + "%"}`
        )
      );
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Apply sorting
    if (options?.sortBy) {
      switch (options.sortBy) {
        case "rating_high":
          query = query.orderBy(desc(courses.rating));
          break;
        case "rating_low":
          query = query.orderBy(asc(courses.rating));
          break;
        case "popular":
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
          sql`${courses.shortIntro} LIKE ${"%" + options.search + "%"}`,
          sql`${courses.skills} LIKE ${"%" + options.search + "%"}`
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
    const result = await db
      .select({ category: courses.category })
      .from(courses)
      .where(sql`${courses.category} IS NOT NULL`)
      .groupBy(courses.category);
    return result.map((r) => r.category || "").filter((c) => c !== "");
  }

  async getSubCategories(): Promise<string[]> {
    const result = await db
      .select({ subCategory: courses.subCategory })
      .from(courses)
      .where(sql`${courses.subCategory} IS NOT NULL`)
      .groupBy(courses.subCategory);
    return result.map((r) => r.subCategory || "").filter((c) => c !== "");
  }

  async getCourseTypes(): Promise<string[]> {
    const result = await db
      .select({ courseType: courses.courseType })
      .from(courses)
      .where(sql`${courses.courseType} IS NOT NULL`)
      .groupBy(courses.courseType);
    return result.map((r) => r.courseType || "").filter((c) => c !== "");
  }

  async getLanguages(): Promise<string[]> {
    const result = await db
      .select({ language: courses.language })
      .from(courses)
      .where(sql`${courses.language} IS NOT NULL`)
      .groupBy(courses.language);
    return result.map((r) => r.language || "").filter((c) => c !== "");
  }

  async getSkills(): Promise<string[]> {
    const result = await db
      .select({ skills: courses.skills })
      .from(courses)
      .where(sql`${courses.skills} IS NOT NULL`);

    // Extract and deduplicate skills
    const skillSet = new Set<string>();
    result.forEach((r) => {
      if (r.skills) {
        r.skills
          .split(",")
          .map((s) => s.trim())
          .forEach((skill) => {
            if (skill) skillSet.add(skill);
          });
      }
    });

    return Array.from(skillSet);
  }

  async getBookmark(
    userId: number,
    courseId: number
  ): Promise<Bookmark | undefined> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(
        and(eq(bookmarks.userId, userId), eq(bookmarks.courseId, courseId))
      );
    return bookmark || undefined;
  }

  async getBookmarksByUserId(userId: number): Promise<Bookmark[]> {
    return await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId));
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const [bookmark] = await db
      .insert(bookmarks)
      .values(insertBookmark)
      .returning();
    return bookmark;
  }

  async deleteBookmark(userId: number, courseId: number): Promise<boolean> {
    await db
      .delete(bookmarks)
      .where(
        and(eq(bookmarks.userId, userId), eq(bookmarks.courseId, courseId))
      );
    return true; // Drizzle doesn't have an easy way to check affected rows, so assuming success
  }

  async createSearchHistory(
    insertSearchHistory: InsertSearchHistory
  ): Promise<SearchHistory> {
    const [result] = await db
      .insert(searchHistory)
      .values(insertSearchHistory)
      .returning();
    return result;
  }

  async getSearchHistoryByUserId(userId: number): Promise<SearchHistory[]> {
    return await db
      .select()
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.createdAt))
      .limit(200); // Limit to 200 most recent searches
  }

  // Subscriber operations
  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    const [subscriber] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email));
    return subscriber || undefined;
  }

  async createSubscriber(
    insertSubscriber: InsertSubscriber
  ): Promise<Subscriber> {
    // Set default values before inserting
    const subscriber = {
      ...insertSubscriber,
      createdAt: new Date().toISOString(),
      status: "active",
    };

    const [result] = await db
      .insert(subscribers)
      .values(subscriber)
      .returning();
    return result;
  }

  async getAllSubscribers(): Promise<Subscriber[]> {
    return await db
      .select()
      .from(subscribers)
      .orderBy(desc(subscribers.createdAt));
  }

  // Comment operations
  async getCommentsByCourseId(courseId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.courseId, courseId))
      .orderBy(desc(comments.createdAt));
  }

  async getCommentById(id: number): Promise<Comment | undefined> {
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id));
    return comment || undefined;
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    // Ensure createdAt is properly set
    const comment = {
      ...insertComment,
      createdAt: insertComment.createdAt || new Date().toISOString(),
    };

    const [result] = await db.insert(comments).values(comment).returning();
    return result;
  }

  async updateComment(
    id: number,
    content: string,
    rating?: number
  ): Promise<Comment | undefined> {
    // First check if comment exists
    const existingComment = await this.getCommentById(id);
    if (!existingComment) {
      return undefined;
    }

    // Prepare update data
    const updateData: Partial<Comment> = {
      content,
      updatedAt: new Date().toISOString(),
    };

    if (rating !== undefined) {
      updateData.rating = rating;
    }

    // Update comment
    const [updated] = await db
      .update(comments)
      .set(updateData)
      .where(eq(comments.id, id))
      .returning();

    return updated;
  }

  async deleteComment(id: number, userId: number): Promise<boolean> {
    // First check if comment exists and belongs to the user
    const [comment] = await db
      .select()
      .from(comments)
      .where(and(eq(comments.id, id), eq(comments.userId, userId)));

    if (!comment) {
      return false;
    }

    // Delete comment
    await db.delete(comments).where(eq(comments.id, id));
    return true;
  }

  // Learning post operations
  async getLearningPost(id: number): Promise<LearningPost | undefined> {
    const [post] = await db
      .select()
      .from(learningPosts)
      .where(eq(learningPosts.id, id));
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

  async createLearningPost(
    insertPost: InsertLearningPost
  ): Promise<LearningPost> {
    const [post] = await db
      .insert(learningPosts)
      .values(insertPost)
      .returning();
    return post;
  }

  async updateLearningPost(
    id: number,
    post: Partial<InsertLearningPost>
  ): Promise<LearningPost | undefined> {
    const [updatedPost] = await db
      .update(learningPosts)
      .set({
        ...post,
        updatedAt: new Date(),
      })
      .where(eq(learningPosts.id, id))
      .returning();
    return updatedPost || undefined;
  }

  async deleteLearningPost(id: number, userId: number): Promise<boolean> {
    // First, ensure the post exists and belongs to the user
    const [post] = await db
      .select()
      .from(learningPosts)
      .where(and(eq(learningPosts.id, id), eq(learningPosts.userId, userId)));

    if (!post) return false;

    // Delete all associated data first
    await db.delete(learningPostLikes).where(eq(learningPostLikes.postId, id));
    await db
      .delete(learningPostComments)
      .where(eq(learningPostComments.postId, id));
    await db
      .delete(learningPostBookmarks)
      .where(eq(learningPostBookmarks.postId, id));

    // Then delete the post
    await db.delete(learningPosts).where(eq(learningPosts.id, id));
    return true;
  }

  async incrementLearningPostViews(id: number): Promise<void> {
    await db
      .update(learningPosts)
      .set({
        views: sql`${learningPosts.views} + 1`,
      })
      .where(eq(learningPosts.id, id));
  }

  // Learning post comment operations
  async getLearningPostComment(
    id: number
  ): Promise<LearningPostComment | undefined> {
    const [comment] = await db
      .select()
      .from(learningPostComments)
      .where(eq(learningPostComments.id, id));
    return comment || undefined;
  }

  async getLearningPostCommentsByPostId(
    postId: number
  ): Promise<LearningPostComment[]> {
    return await db
      .select()
      .from(learningPostComments)
      .where(eq(learningPostComments.postId, postId))
      .orderBy(asc(learningPostComments.createdAt));
  }

  async getLearningPostCommentsByUserId(
    userId: number
  ): Promise<LearningPostComment[]> {
    return await db
      .select()
      .from(learningPostComments)
      .where(eq(learningPostComments.userId, userId))
      .orderBy(desc(learningPostComments.createdAt));
  }

  async getLearningPostCommentsCount(postId: number): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(learningPostComments)
      .where(eq(learningPostComments.postId, postId));
    return Number(result[0]?.count || 0);
  }

  async createLearningPostComment(
    insertComment: InsertLearningPostComment
  ): Promise<LearningPostComment> {
    const [comment] = await db
      .insert(learningPostComments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async updateLearningPostComment(
    id: number,
    content: string
  ): Promise<LearningPostComment | undefined> {
    const [updatedComment] = await db
      .update(learningPostComments)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(learningPostComments.id, id))
      .returning();
    return updatedComment || undefined;
  }

  async deleteLearningPostComment(
    id: number,
    userId: number
  ): Promise<boolean> {
    await db
      .delete(learningPostComments)
      .where(
        and(
          eq(learningPostComments.id, id),
          eq(learningPostComments.userId, userId)
        )
      );
    return true;
  }

  // Learning post like operations
  async getLearningPostLike(
    postId: number,
    userId: number
  ): Promise<LearningPostLike | undefined> {
    const [like] = await db
      .select()
      .from(learningPostLikes)
      .where(
        and(
          eq(learningPostLikes.postId, postId),
          eq(learningPostLikes.userId, userId)
        )
      );
    return like || undefined;
  }

  async getLearningPostLikesByPostId(
    postId: number
  ): Promise<LearningPostLike[]> {
    return await db
      .select()
      .from(learningPostLikes)
      .where(eq(learningPostLikes.postId, postId));
  }

  async getLearningPostLikesByUserId(
    userId: number
  ): Promise<LearningPostLike[]> {
    return await db
      .select()
      .from(learningPostLikes)
      .where(eq(learningPostLikes.userId, userId))
      .orderBy(desc(learningPostLikes.createdAt));
  }

  async createLearningPostLike(
    insertLike: InsertLearningPostLike
  ): Promise<LearningPostLike> {
    const [like] = await db
      .insert(learningPostLikes)
      .values(insertLike)
      .returning();
    return like;
  }

  async deleteLearningPostLike(
    postId: number,
    userId: number
  ): Promise<boolean> {
    await db
      .delete(learningPostLikes)
      .where(
        and(
          eq(learningPostLikes.postId, postId),
          eq(learningPostLikes.userId, userId)
        )
      );
    return true;
  }

  async getLearningPostLikesCount(postId: number): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(learningPostLikes)
      .where(eq(learningPostLikes.postId, postId));
    return Number(result[0]?.count || 0);
  }

  // Learning post bookmark operations
  async getLearningPostBookmark(
    postId: number,
    userId: number
  ): Promise<LearningPostBookmark | undefined> {
    const [bookmark] = await db
      .select()
      .from(learningPostBookmarks)
      .where(
        and(
          eq(learningPostBookmarks.postId, postId),
          eq(learningPostBookmarks.userId, userId)
        )
      );
    return bookmark || undefined;
  }

  async getLearningPostBookmarksByUserId(
    userId: number
  ): Promise<LearningPostBookmark[]> {
    return await db
      .select()
      .from(learningPostBookmarks)
      .where(eq(learningPostBookmarks.userId, userId));
  }

  async createLearningPostBookmark(
    insertBookmark: InsertLearningPostBookmark
  ): Promise<LearningPostBookmark> {
    const [bookmark] = await db
      .insert(learningPostBookmarks)
      .values(insertBookmark)
      .returning();
    return bookmark;
  }

  async deleteLearningPostBookmark(
    postId: number,
    userId: number
  ): Promise<boolean> {
    await db
      .delete(learningPostBookmarks)
      .where(
        and(
          eq(learningPostBookmarks.postId, postId),
          eq(learningPostBookmarks.userId, userId)
        )
      );
    return true;
  }

  // Learning post tag operations
  async getLearningPostTags(): Promise<string[]> {
    const result = await db
      .select({ tags: learningPosts.tags })
      .from(learningPosts)
      .where(sql`${learningPosts.tags} IS NOT NULL`);

    // Extract and deduplicate tags
    const tagSet = new Set<string>();
    result.forEach((r) => {
      if (r.tags && r.tags.length > 0) {
        r.tags.forEach((tag) => {
          if (tag) tagSet.add(tag);
        });
      }
    });

    return Array.from(tagSet);
  }

  // AI conversation operations
  async getAiConversation(id: number): Promise<AiConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.id, id));
    return conversation || undefined;
  }

  async getAiConversationsByUserId(userId: number): Promise<AiConversation[]> {
    return await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.createdAt));
  }

  async createAiConversation(
    conversation: InsertAiConversation
  ): Promise<AiConversation> {
    const [result] = await db
      .insert(aiConversations)
      .values(conversation)
      .returning();
    return result;
  }

  async updateAiConversation(
    id: number,
    data: Partial<InsertAiConversation>
  ): Promise<AiConversation | undefined> {
    const [updated] = await db
      .update(aiConversations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(aiConversations.id, id))
      .returning();
    return updated;
  }

  async deleteAiConversation(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(aiConversations)
      .where(
        and(eq(aiConversations.id, id), eq(aiConversations.userId, userId))
      );
    return result.rowCount > 0;
  }

  // Method application operations
  async getMethodApplication(
    id: number
  ): Promise<MethodApplication | undefined> {
    const [methodApp] = await db
      .select()
      .from(methodApplications)
      .where(eq(methodApplications.id, id));
    return methodApp || undefined;
  }

  async getMethodApplicationsByUserId(
    userId: number
  ): Promise<MethodApplication[]> {
    return await db
      .select()
      .from(methodApplications)
      .where(eq(methodApplications.userId, userId))
      .orderBy(desc(methodApplications.createdAt));
  }

  async getMethodApplicationsByMethodId(
    methodPostId: number
  ): Promise<MethodApplication[]> {
    return await db
      .select()
      .from(methodApplications)
      .where(eq(methodApplications.methodPostId, methodPostId))
      .orderBy(desc(methodApplications.createdAt));
  }

  async getMethodApplicationByUserAndMethod(
    userId: number,
    methodPostId: number
  ): Promise<MethodApplication | undefined> {
    const [methodApp] = await db
      .select()
      .from(methodApplications)
      .where(
        and(
          eq(methodApplications.userId, userId),
          eq(methodApplications.methodPostId, methodPostId)
        )
      );
    return methodApp || undefined;
  }

  async createMethodApplication(
    application: InsertMethodApplication
  ): Promise<MethodApplication> {
    const [methodApp] = await db
      .insert(methodApplications)
      .values(application)
      .returning();
    return methodApp;
  }

  async updateMethodApplication(
    id: number,
    data: Partial<InsertMethodApplication>
  ): Promise<MethodApplication | undefined> {
    const [updatedMethodApp] = await db
      .update(methodApplications)
      .set(data)
      .where(eq(methodApplications.id, id))
      .returning();
    return updatedMethodApp;
  }

  async deleteMethodApplication(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(methodApplications)
      .where(
        and(
          eq(methodApplications.id, id),
          eq(methodApplications.userId, userId)
        )
      );
    return result.rowCount > 0;
  }

  async getActiveMethodApplicationsByUserId(
    userId: number
  ): Promise<MethodApplication[]> {
    return await db
      .select()
      .from(methodApplications)
      .where(
        and(
          eq(methodApplications.userId, userId),
          eq(methodApplications.status, "active")
        )
      )
      .orderBy(desc(methodApplications.createdAt));
  }

  async getCompletedMethodApplicationsByUserId(
    userId: number
  ): Promise<MethodApplication[]> {
    return await db
      .select()
      .from(methodApplications)
      .where(
        and(
          eq(methodApplications.userId, userId),
          eq(methodApplications.status, "completed")
        )
      )
      .orderBy(desc(methodApplications.createdAt));
  }

  async getMethodApplicationsCount(methodPostId: number): Promise<number> {
    const result = await db
      .select({
        count: sql`count(*)`,
      })
      .from(methodApplications)
      .where(eq(methodApplications.methodPostId, methodPostId));

    return Number(result[0]?.count || 0);
  }

  // Gamification operations
  async getUserGamification(
    userId: number
  ): Promise<UserGamification | undefined> {
    const [gamification] = await db
      .select()
      .from(userGamification)
      .where(eq(userGamification.userId, userId));
    return gamification || undefined;
  }

  async createUserGamification(
    data: InsertUserGamification
  ): Promise<UserGamification> {
    const [gamification] = await db
      .insert(userGamification)
      .values(data)
      .returning();
    return gamification;
  }

  async updateUserGamification(
    userId: number,
    data: Partial<InsertUserGamification>
  ): Promise<UserGamification | undefined> {
    const [updated] = await db
      .update(userGamification)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userGamification.userId, userId))
      .returning();

    return updated;
  }

  async addUserPoints(
    userId: number,
    points: number
  ): Promise<UserGamification | undefined> {
    // Get current user gamification
    let userGamificationData = await this.getUserGamification(userId);

    if (!userGamificationData) {
      // Create new gamification record if it doesn't exist
      userGamificationData = await this.createUserGamification({
        userId,
        points,
        level: 1,
        streak: 0,
      });
    } else {
      // Add points to existing record
      const newPoints = userGamificationData.points + points;
      let newLevel = userGamificationData.level;

      // Simple level up logic
      const pointsForNextLevel = newLevel * 100; // Each level requires level * 100 points
      if (newPoints >= pointsForNextLevel) {
        newLevel += 1;
      }

      userGamificationData = await this.updateUserGamification(userId, {
        points: newPoints,
        level: newLevel,
        lastActivity: new Date(),
      });
    }

    return userGamificationData;
  }

  async incrementUserStreak(
    userId: number
  ): Promise<UserGamification | undefined> {
    // Get current user gamification
    let userGamificationData = await this.getUserGamification(userId);

    if (!userGamificationData) {
      // Create new gamification record if it doesn't exist
      userGamificationData = await this.createUserGamification({
        userId,
        points: 5, // Bonus points for first streak
        level: 1,
        streak: 1,
      });
    } else {
      const now = new Date();
      const lastActivity = userGamificationData.lastActivity;

      // Check if streak should be reset (more than 48 hours since last activity)
      let newStreak = userGamificationData.streak;
      if (
        !lastActivity ||
        now.getTime() - lastActivity.getTime() > 48 * 60 * 60 * 1000
      ) {
        newStreak = 1; // Reset streak
      } else if (now.getTime() - lastActivity.getTime() > 20 * 60 * 60 * 1000) {
        // If more than 20 hours since last activity, increment streak
        newStreak += 1;
      }

      // Update streak
      userGamificationData = await this.updateUserGamification(userId, {
        streak: newStreak,
        lastActivity: now,
        points: userGamificationData.points + 5, // Add 5 points for maintaining streak
      });
    }

    return userGamificationData;
  }

  // User badges operations
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.awardedAt));
  }

  async createUserBadge(badge: InsertUserBadge): Promise<UserBadge> {
    // Check if badge already exists
    const [existingBadge] = await db
      .select()
      .from(userBadges)
      .where(
        and(
          eq(userBadges.userId, badge.userId),
          eq(userBadges.badgeId, badge.badgeId)
        )
      );

    if (existingBadge) {
      return existingBadge; // Badge already awarded
    }

    // Award new badge and add points
    const [newBadge] = await db.insert(userBadges).values(badge).returning();

    // Add 25 points for earning a badge
    await this.addUserPoints(badge.userId, 25);

    return newBadge;
  }

  // Recommendations operations
  async getUserRecommendations(
    userId: number,
    limit: number = 5
  ): Promise<(UserRecommendation & { course: Course })[]> {
    const recommendations = await db
      .select({
        recommendation: userRecommendations,
        course: courses,
      })
      .from(userRecommendations)
      .innerJoin(courses, eq(userRecommendations.courseId, courses.id))
      .where(eq(userRecommendations.userId, userId))
      .orderBy(desc(userRecommendations.score))
      .limit(limit);

    return recommendations.map((r) => ({
      ...r.recommendation,
      course: r.course,
    }));
  }

  async createUserRecommendation(
    recommendation: InsertUserRecommendation
  ): Promise<UserRecommendation> {
    // Check if recommendation already exists
    const [existingRec] = await db
      .select()
      .from(userRecommendations)
      .where(
        and(
          eq(userRecommendations.userId, recommendation.userId),
          eq(userRecommendations.courseId, recommendation.courseId)
        )
      );

    if (existingRec) {
      // Update existing recommendation with new score if provided
      if (recommendation.score !== undefined) {
        const [updated] = await db
          .update(userRecommendations)
          .set({
            score: recommendation.score,
            reason: recommendation.reason,
            trending: recommendation.trending,
            updatedAt: new Date(),
          })
          .where(eq(userRecommendations.id, existingRec.id))
          .returning();

        return updated;
      }
      return existingRec;
    }

    // Create new recommendation
    const [newRec] = await db
      .insert(userRecommendations)
      .values(recommendation)
      .returning();
    return newRec;
  }

  async updateUserRecommendation(
    id: number,
    data: Partial<InsertUserRecommendation>
  ): Promise<UserRecommendation | undefined> {
    const [updated] = await db
      .update(userRecommendations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userRecommendations.id, id))
      .returning();

    return updated;
  }

  async generateRecommendations(
    userId: number
  ): Promise<(UserRecommendation & { course: Course })[]> {
    // PATCH: Always generate fresh recommendations for each request (disable caching for testing)
    // In production, restore the following lines to enable caching:
    // const existing = await this.getUserRecommendations(userId);
    // if (existing.length > 0) {
    //   return existing;
    // }

    // Aggregate user interactions
    const [bookmarks, posts, comments, likes, searchHistory, aiConvos] =
      await Promise.all([
        this.getBookmarksByUserId(userId),
        this.getLearningPosts({ userId }),
        this.getLearningPostCommentsByUserId(userId),
        this.getLearningPostLikesByUserId(userId),
        this.getSearchHistoryByUserId(userId),
        this.getAiConversationsByUserId(userId),
      ]);

    // Collect all course IDs the user has interacted with
    const interactedCourseIds = new Set<number>();
    // Bookmarks reference courseId directly
    bookmarks.forEach((b) => interactedCourseIds.add(b.courseId));
    // Posts reference courseId directly (if present)
    posts.forEach((p) => {
      if ((p as any).courseId) interactedCourseIds.add((p as any).courseId);
    });
    // Comments and likes reference postId; resolve to courseId
    const postIdSet = new Set<number>();
    comments.forEach((c) => {
      if (c.postId) postIdSet.add(c.postId);
    });
    likes.forEach((l) => {
      if (l.postId) postIdSet.add(l.postId);
    });
    // Fetch posts for these postIds
    const postIdArr = Array.from(postIdSet);
    let relatedPosts: any[] = [];
    if (postIdArr.length > 0) {
      relatedPosts = await Promise.all(
        postIdArr.map((id) => this.getLearningPost(id))
      );
      relatedPosts.forEach((p) => {
        if (p && (p as any).courseId)
          interactedCourseIds.add((p as any).courseId);
      });
    }

    // Collect metadata from interacted courses
    const allCourseIds = Array.from(interactedCourseIds).filter(Boolean);
    const interactedCourses =
      allCourseIds.length > 0 ? await this.getCoursesByIds(allCourseIds) : [];
    const categories = new Set<string>();
    const subCategories = new Set<string>();
    const skills = new Set<string>();
    interactedCourses.forEach((course) => {
      if (course.category) categories.add(course.category);
      if (course.subCategory) subCategories.add(course.subCategory);
      if (course.skills)
        course.skills.split(",").forEach((skill) => skills.add(skill.trim()));
    });

    // Extract keywords from search history and AI chat
    const keywords = new Set<string>();
    searchHistory.forEach((s) => {
      if ((s as any).searchQuery)
        (s as any).searchQuery
          .split(/\s+/)
          .forEach((word) => keywords.add(word.toLowerCase()));
    });
    aiConvos.forEach((c) => {
      if (Array.isArray((c as any).messages)) {
        (c as any).messages.forEach((m: any) => {
          if (m.content)
            m.content
              .split(/\s+/)
              .forEach((word: string) => keywords.add(word.toLowerCase()));
        });
      }
    });

    // NEW: Extract keywords from authored posts
    posts.forEach((p) => {
      if (p.content) {
        p.content
          .split(/\s+/)
          .forEach((word: string) => keywords.add(word.toLowerCase()));
      }
    });

    // NEW: Extract keywords from authored comments
    comments.forEach((c) => {
      if (c.content) {
        c.content
          .split(/\s+/)
          .forEach((word: string) => keywords.add(word.toLowerCase()));
      }
    });

    // NEW: Extract keywords from liked posts
    if (likes.length > 0) {
      const likedPosts = await Promise.all(
        likes.map((l) => this.getLearningPost(l.postId))
      );
      likedPosts.forEach((p) => {
        if (p && p.content) {
          p.content
            .split(/\s+/)
            .forEach((word: string) => keywords.add(word.toLowerCase()));
        }
      });
      // (Optional) Extract keywords from comments on liked posts
      for (const p of likedPosts) {
        if (p) {
          const postComments = await this.getLearningPostCommentsByPostId(p.id);
          postComments.forEach((c) => {
            if (c.content) {
              c.content
                .split(/\s+/)
                .forEach((word: string) => keywords.add(word.toLowerCase()));
            }
          });
        }
      }
    }

    // Build user profile vector
    const userProfile = {
      categories,
      subCategories,
      skills,
      keywords,
    };

    // Fetch candidate courses (not already interacted)
    const candidateCourses = await this.getCourses({ limit: 100 });
    const filteredCandidates = candidateCourses.filter(
      (c) => c.id && !interactedCourseIds.has(c.id)
    );

    // Score candidates by content similarity
    function scoreCourse(course: Course): number {
      let score = 0;
      if (course.category && userProfile.categories.has(course.category))
        score += 2;
      if (
        course.subCategory &&
        userProfile.subCategories.has(course.subCategory)
      )
        score += 1.5;
      if (course.skills)
        course.skills.split(",").forEach((skill) => {
          if (userProfile.skills.has(skill.trim())) score += 1;
        });
      // Keyword match in title/description
      const text = `${course.title} ${course.shortIntro || ""}`.toLowerCase();
      userProfile.keywords.forEach((kw) => {
        if (text.includes(kw)) score += 0.2;
      });
      // Bonus for highly rated or trending
      if (course.rating && course.rating > 4.5) score += 0.5;
      if (course.numberOfViewers && course.numberOfViewers > 10000)
        score += 0.3;
      return score;
    }
    const scored = filteredCandidates.map((course) => ({
      course,
      score: scoreCourse(course),
    }));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 5);

    // Create recommendations
    const recommendations: (UserRecommendation & { course: Course })[] = [];
    for (const { course, score } of top) {
      let reason = "Based on your learning activity";
      if (course.category && userProfile.categories.has(course.category))
        reason = `Similar to your interests in ${course.category}`;
      else if (course.rating && course.rating > 4.5)
        reason = "Highly rated course you might enjoy";
      else if (course.numberOfViewers && course.numberOfViewers > 10000)
        reason = "Popular with many learners";
      const rec = await this.createUserRecommendation({
        userId,
        courseId: course.id,
        score,
        reason,
        trending: !!course.numberOfViewers && course.numberOfViewers > 50000,
      });
      recommendations.push({ ...rec, course });
    }
    return recommendations;
  }

  // User Events operations
  async getUserEvent(id: number): Promise<UserEvent | undefined> {
    const [event] = await db
      .select()
      .from(userEvents)
      .where(eq(userEvents.id, id));
    return event || undefined;
  }

  async getUserEvents(
    userId: number,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      upcoming?: boolean;
      eventType?: string;
    }
  ): Promise<UserEvent[]> {
    let query = db
      .select()
      .from(userEvents)
      .where(eq(userEvents.userId, userId));

    // Apply filters
    if (options?.eventType) {
      query = query.where(eq(userEvents.eventType, options.eventType));
    }

    if (options?.startDate) {
      query = query.where(sql`${userEvents.startDate} >= ${options.startDate}`);
    }

    if (options?.endDate) {
      query = query.where(sql`${userEvents.startDate} <= ${options.endDate}`);
    }

    if (options?.upcoming) {
      // Get events from today onwards
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query = query.where(sql`${userEvents.startDate} >= ${today}`);

      // Order by closest upcoming date
      query = query.orderBy(asc(userEvents.startDate));
    } else {
      // Default ordering by start date (descending - most recent first)
      query = query.orderBy(desc(userEvents.startDate));
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    return await query;
  }

  async createUserEvent(event: InsertUserEvent): Promise<UserEvent> {
    const [createdEvent] = await db
      .insert(userEvents)
      .values(event)
      .returning();
    return createdEvent;
  }

  async updateUserEvent(
    id: number,
    event: Partial<InsertUserEvent>
  ): Promise<UserEvent | undefined> {
    const [updatedEvent] = await db
      .update(userEvents)
      .set({
        ...event,
        updatedAt: new Date(),
      })
      .where(eq(userEvents.id, id))
      .returning();
    return updatedEvent || undefined;
  }

  async deleteUserEvent(id: number, userId: number): Promise<boolean> {
    // First check if event exists and belongs to the user
    const [event] = await db
      .select()
      .from(userEvents)
      .where(and(eq(userEvents.id, id), eq(userEvents.userId, userId)));

    if (!event) return false;

    // Delete the event
    await db.delete(userEvents).where(eq(userEvents.id, id));
    return true;
  }

  async getEventsByDateRange(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<UserEvent[]> {
    return await db
      .select()
      .from(userEvents)
      .where(
        and(
          eq(userEvents.userId, userId),
          sql`${userEvents.startDate} >= ${startDate}`,
          sql`${userEvents.startDate} <= ${endDate}`
        )
      )
      .orderBy(asc(userEvents.startDate));
  }

  async getUpcomingEvents(
    userId: number,
    limit: number = 5
  ): Promise<UserEvent[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await db
      .select()
      .from(userEvents)
      .where(
        and(
          eq(userEvents.userId, userId),
          sql`${userEvents.startDate} >= ${today}`
        )
      )
      .orderBy(asc(userEvents.startDate))
      .limit(limit);
  }

  // User Notes operations
  async getUserNote(id: number): Promise<UserNote | undefined> {
    try {
      // Select only the fields that definitely exist in the database
      const [note] = await db
        .select({
          id: userNotes.id,
          userId: userNotes.userId,
          content: userNotes.content,
          pageUrl: userNotes.pageUrl,
          pageTitle: userNotes.pageTitle,
          courseId: userNotes.courseId,
          tags: userNotes.tags,
          color: userNotes.color,
          isPinned: userNotes.isPinned,
          createdAt: userNotes.createdAt,
          updatedAt: userNotes.updatedAt,
        })
        .from(userNotes)
        .where(eq(userNotes.id, id));

      if (!note) return undefined;

      // Add default values for new fields that might not be in the database yet
      return {
        ...note,
        imageUrl: "",
        fontSize: "normal",
        position: "",
        isExpanded: false,
      };
    } catch (error) {
      console.error("Error in getUserNote:", error);
      throw error;
    }
  }

  async getUserNotes(
    userId: number,
    options?: {
      limit?: number;
      offset?: number;
      tag?: string;
      courseId?: number;
      isPinned?: boolean;
    }
  ): Promise<UserNote[]> {
    try {
      // Select only the fields that definitely exist in the database
      // This avoids errors if the schema hasn't been fully updated
      let query = db
        .select({
          id: userNotes.id,
          userId: userNotes.userId,
          content: userNotes.content,
          pageUrl: userNotes.pageUrl,
          pageTitle: userNotes.pageTitle,
          courseId: userNotes.courseId,
          tags: userNotes.tags,
          color: userNotes.color,
          isPinned: userNotes.isPinned,
          createdAt: userNotes.createdAt,
          updatedAt: userNotes.updatedAt,
        })
        .from(userNotes)
        .where(eq(userNotes.userId, userId));

      // Apply filters
      if (options?.tag) {
        query = query.where(arrayContains(userNotes.tags, [options.tag]));
      }

      if (options?.courseId) {
        query = query.where(eq(userNotes.courseId, options.courseId));
      }

      if (options?.isPinned !== undefined) {
        query = query.where(eq(userNotes.isPinned, options.isPinned));
      }

      // Order by pinned notes first, then by creation date
      query = query.orderBy(
        desc(userNotes.isPinned),
        desc(userNotes.createdAt)
      );

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.offset(options.offset);
      }

      const notes = await query;

      // Add default values for new fields that might not be in the database yet
      return notes.map((note) => ({
        ...note,
        imageUrl: "",
        fontSize: "normal",
        position: "",
        isExpanded: false,
      }));
    } catch (error) {
      console.error("Error in getUserNotes:", error);
      throw error;
    }
  }

  async createUserNote(note: InsertUserNote): Promise<UserNote> {
    try {
      // Extract the fields that we know exist in the database
      const safeNote = {
        userId: note.userId,
        content: note.content,
        pageUrl: note.pageUrl,
        pageTitle: note.pageTitle,
        courseId: note.courseId,
        tags: note.tags,
        color: note.color,
        isPinned: note.isPinned,
      };

      const [result] = await db.insert(userNotes).values(safeNote).returning();

      // Add the new fields as defaults to the response
      return {
        ...result,
        imageUrl: note.imageUrl || "",
        fontSize: note.fontSize || "normal",
        position: note.position || "",
        isExpanded: note.isExpanded || false,
      };
    } catch (error) {
      console.error("Error in createUserNote:", error);
      throw error;
    }
  }

  async updateUserNote(
    id: number,
    note: Partial<InsertUserNote>
  ): Promise<UserNote | undefined> {
    try {
      // First ensure the note exists
      const existingNote = await this.getUserNote(id);
      if (!existingNote) {
        return undefined;
      }

      // Extract only the fields that exist in the database
      const safeNote: any = {};

      // Extract safe fields
      if (note.content !== undefined) safeNote.content = note.content;
      if (note.pageUrl !== undefined) safeNote.pageUrl = note.pageUrl;
      if (note.pageTitle !== undefined) safeNote.pageTitle = note.pageTitle;
      if (note.courseId !== undefined) safeNote.courseId = note.courseId;
      if (note.tags !== undefined) safeNote.tags = note.tags;
      if (note.color !== undefined) safeNote.color = note.color;
      if (note.isPinned !== undefined) safeNote.isPinned = note.isPinned;

      // Always update the updatedAt field
      safeNote.updatedAt = new Date();

      // Update the note with only the fields that exist in the database
      const [dbUpdatedNote] = await db
        .update(userNotes)
        .set(safeNote)
        .where(eq(userNotes.id, id))
        .returning();

      // Start with the base note from the database
      const updatedNote = { ...dbUpdatedNote };

      // Add the new fields, preserving any that were sent in the update
      updatedNote.imageUrl =
        note.imageUrl !== undefined ? note.imageUrl : existingNote.imageUrl;
      updatedNote.fontSize =
        note.fontSize !== undefined ? note.fontSize : existingNote.fontSize;
      updatedNote.position =
        note.position !== undefined ? note.position : existingNote.position;
      updatedNote.isExpanded =
        note.isExpanded !== undefined
          ? note.isExpanded
          : existingNote.isExpanded;

      return updatedNote;
    } catch (error) {
      console.error("Error updating note:", error);
      return undefined;
    }
  }

  async deleteUserNote(id: number, userId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(userNotes)
        .where(and(eq(userNotes.id, id), eq(userNotes.userId, userId)));

      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting note:", error);
      return false;
    }
  }

  async getUserNoteTags(userId: number): Promise<string[]> {
    const notes = await db
      .select({ tags: userNotes.tags })
      .from(userNotes)
      .where(eq(userNotes.userId, userId));

    // Extract and deduplicate tags
    const tagSet = new Set<string>();
    notes.forEach((note) => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach((tag) => {
          if (tag) tagSet.add(tag);
        });
      }
    });

    return Array.from(tagSet);
  }

  // Chat Messages operations
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    const [message] = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.id, id));
    return message || undefined;
  }

  async getChatMessagesBetweenUsers(
    userId1: number,
    userId2: number,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<ChatMessage[]> {
    let query = db
      .select()
      .from(chatMessages)
      .where(
        or(
          and(
            eq(chatMessages.senderId, userId1),
            eq(chatMessages.receiverId, userId2)
          ),
          and(
            eq(chatMessages.senderId, userId2),
            eq(chatMessages.receiverId, userId1)
          )
        )
      )
      .orderBy(asc(chatMessages.createdAt));

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [result] = await db.insert(chatMessages).values(message).returning();
    return result;
  }

  async markChatMessagesAsRead(
    senderId: number,
    receiverId: number
  ): Promise<boolean> {
    // Mark all messages from sender to receiver as read
    const result = await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.senderId, senderId),
          eq(chatMessages.receiverId, receiverId),
          eq(chatMessages.isRead, false)
        )
      );

    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(chatMessages)
      .where(
        and(eq(chatMessages.receiverId, userId), eq(chatMessages.isRead, false))
      );

    return Number(result[0]?.count || 0);
  }

  async getChatPartners(userId: number): Promise<User[]> {
    // Get all unique users that the current user has chatted with
    const sentToUsers = await db
      .select({
        user: users,
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.receiverId, users.id))
      .where(eq(chatMessages.senderId, userId))
      .groupBy(users.id);

    const receivedFromUsers = await db
      .select({
        user: users,
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.receiverId, userId))
      .groupBy(users.id);

    // Combine and deduplicate users
    const uniqueUsers = new Map<number, User>();
    sentToUsers.forEach((u) => uniqueUsers.set(u.user.id, u.user));
    receivedFromUsers.forEach((u) => uniqueUsers.set(u.user.id, u.user));

    // Remove the current user from the list of chat partners
    uniqueUsers.delete(userId);

    return Array.from(uniqueUsers.values());
  }

  async getChatHistory(
    userId1: number,
    userId2: number,
    limit: number = 50,
    before?: number
  ): Promise<ChatMessage[]> {
    let query = db
      .select()
      .from(chatMessages)
      .where(
        or(
          and(
            eq(chatMessages.senderId, userId1),
            eq(chatMessages.receiverId, userId2)
          ),
          and(
            eq(chatMessages.senderId, userId2),
            eq(chatMessages.receiverId, userId1)
          )
        )
      );

    if (before) {
      query = query.where(sql`${chatMessages.id} < ${before}`);
    }

    const messages = await query
      .orderBy(asc(chatMessages.createdAt))
      .limit(limit);

    return messages;
  }

  async getUnreadMessagesForUser(userId: number): Promise<ChatMessage[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(
        and(eq(chatMessages.receiverId, userId), eq(chatMessages.isRead, false))
      )
      .orderBy(asc(chatMessages.createdAt));

    return messages;
  }

  async canUsersChat(userId1: number, userId2: number): Promise<boolean> {
    // For now, allow any users to chat with each other
    // In a real application, this might be restricted based on relationships
    return true;
  }

  // University Courses operations
  async getUniversityCourse(id: number): Promise<UniversityCourse | undefined> {
    const [course] = await db
      .select()
      .from(universityCourses)
      .where(eq(universityCourses.id, id));
    return course || undefined;
  }

  async getUniversityCourses(options?: {
    limit?: number;
    offset?: number;
    university?: string;
    courseDept?: string;
    search?: string;
  }): Promise<UniversityCourse[]> {
    const {
      limit = 20,
      offset = 0,
      university,
      courseDept,
      search,
    } = options || {};

    let query = db.select().from(universityCourses);

    // Apply filters if provided and not 'all'
    if (university && university !== "all") {
      query = query.where(eq(universityCourses.university, university));
    }

    if (courseDept && courseDept !== "all") {
      query = query.where(eq(universityCourses.courseDept, courseDept));
    }

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      query = query.where(
        or(
          like(sql`LOWER(${universityCourses.courseTitle})`, searchLower),
          like(sql`LOWER(${universityCourses.courseDept})`, searchLower),
          like(sql`LOWER(${universityCourses.courseNumber})`, searchLower),
          like(sql`LOWER(${universityCourses.university})`, searchLower),
          like(sql`LOWER(${universityCourses.description})`, searchLower)
        )
      );
    }

    // Apply pagination and ordering
    query = query
      .limit(limit)
      .offset(offset)
      .orderBy(
        asc(universityCourses.university),
        asc(universityCourses.courseDept),
        asc(universityCourses.courseNumber)
      );

    return await query;
  }

  async getUniversityCoursesCount(options?: {
    university?: string;
    courseDept?: string;
    search?: string;
  }): Promise<number> {
    const { university, courseDept, search } = options || {};

    let query = db.select({ count: sql`count(*)` }).from(universityCourses);

    // Apply filters if provided and not 'all'
    if (university && university !== "all") {
      query = query.where(eq(universityCourses.university, university));
    }

    if (courseDept && courseDept !== "all") {
      query = query.where(eq(universityCourses.courseDept, courseDept));
    }

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      query = query.where(
        or(
          like(sql`LOWER(${universityCourses.courseTitle})`, searchLower),
          like(sql`LOWER(${universityCourses.courseDept})`, searchLower),
          like(sql`LOWER(${universityCourses.courseNumber})`, searchLower),
          like(sql`LOWER(${universityCourses.university})`, searchLower),
          like(sql`LOWER(${universityCourses.description})`, searchLower)
        )
      );
    }

    const result = await query;
    return Number(result[0]?.count || 0);
  }

  async getUniversityCourseByDeptAndNumber(
    university: string,
    courseDept: string,
    courseNumber: string
  ): Promise<UniversityCourse | undefined> {
    const [course] = await db
      .select()
      .from(universityCourses)
      .where(
        and(
          eq(universityCourses.university, university),
          eq(universityCourses.courseDept, courseDept),
          eq(universityCourses.courseNumber, courseNumber)
        )
      );
    return course || undefined;
  }

  async createUniversityCourse(
    course: InsertUniversityCourse
  ): Promise<UniversityCourse> {
    const [createdCourse] = await db
      .insert(universityCourses)
      .values(course)
      .returning();
    return createdCourse;
  }

  async updateUniversityCourse(
    id: number,
    course: Partial<InsertUniversityCourse>
  ): Promise<UniversityCourse | undefined> {
    const [updatedCourse] = await db
      .update(universityCourses)
      .set(course)
      .where(eq(universityCourses.id, id))
      .returning();
    return updatedCourse || undefined;
  }

  async getUniversities(): Promise<string[]> {
    const result = await db
      .select({ university: universityCourses.university })
      .from(universityCourses)
      .where(sql`${universityCourses.university} IS NOT NULL`)
      .groupBy(universityCourses.university);
    return result.map((r) => r.university || "");
  }

  async getCourseDepartments(university?: string): Promise<string[]> {
    let query = db
      .select({ department: universityCourses.courseDept })
      .from(universityCourses)
      .where(sql`${universityCourses.courseDept} IS NOT NULL`);

    // Only apply university filter if a specific university is provided and it's not 'all'
    if (university && university !== "all") {
      query = query.where(eq(universityCourses.university, university));
    }

    const result = await query.groupBy(universityCourses.courseDept);
    return result.map((r) => r.department || "");
  }

  // University Course Bookmark operations
  async getUniversityCourseBookmark(
    userId: number,
    courseId: number
  ): Promise<UniversityCourseBookmark | undefined> {
    const [bookmark] = await db
      .select()
      .from(universityCourseBookmarks)
      .where(
        and(
          eq(universityCourseBookmarks.userId, userId),
          eq(universityCourseBookmarks.universityCourseId, courseId)
        )
      );
    return bookmark || undefined;
  }

  async getUniversityCourseBookmarksByUserId(
    userId: number
  ): Promise<UniversityCourseBookmark[]> {
    return await db
      .select()
      .from(universityCourseBookmarks)
      .where(eq(universityCourseBookmarks.userId, userId));
  }

  async createUniversityCourseBookmark(
    bookmark: InsertUniversityCourseBookmark
  ): Promise<UniversityCourseBookmark> {
    const [createdBookmark] = await db
      .insert(universityCourseBookmarks)
      .values(bookmark)
      .returning();
    return createdBookmark;
  }

  async deleteUniversityCourseBookmark(
    userId: number,
    courseId: number
  ): Promise<boolean> {
    const result = await db
      .delete(universityCourseBookmarks)
      .where(
        and(
          eq(universityCourseBookmarks.userId, userId),
          eq(universityCourseBookmarks.universityCourseId, courseId)
        )
      );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // University Course Links operations
  async getUniversityCourseLink(
    id: number
  ): Promise<UniversityCourseLink | undefined> {
    const [link] = await db
      .select()
      .from(universityCourseLinks)
      .where(eq(universityCourseLinks.id, id));
    return link || undefined;
  }

  async getUniversityCourseLinksByCourseId(
    courseId: number
  ): Promise<UniversityCourseLink[]> {
    return await db
      .select()
      .from(universityCourseLinks)
      .where(eq(universityCourseLinks.courseId, courseId))
      .orderBy(asc(universityCourseLinks.title));
  }

  async createUniversityCourseLink(
    link: InsertUniversityCourseLink
  ): Promise<UniversityCourseLink> {
    const [result] = await db
      .insert(universityCourseLinks)
      .values(link)
      .returning();
    return result;
  }

  async updateUniversityCourseLink(
    id: number,
    link: Partial<InsertUniversityCourseLink>
  ): Promise<UniversityCourseLink | undefined> {
    const updatedFields = {
      ...link,
      updatedAt: new Date(),
    };
    const [result] = await db
      .update(universityCourseLinks)
      .set(updatedFields)
      .where(eq(universityCourseLinks.id, id))
      .returning();
    return result || undefined;
  }

  async deleteUniversityCourseLink(id: number): Promise<boolean> {
    const result = await db
      .delete(universityCourseLinks)
      .where(eq(universityCourseLinks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // University Course Comments operations
  async getUniversityCourseComment(
    id: number
  ): Promise<UniversityCourseComment | undefined> {
    const [comment] = await db
      .select()
      .from(universityCourseComments)
      .where(eq(universityCourseComments.id, id));
    return comment || undefined;
  }

  async getUniversityCourseCommentsByCourseId(
    courseId: number
  ): Promise<UniversityCourseComment[]> {
    return await db
      .select({
        ...universityCourseComments,
        user: {
          id: users.id,
          username: users.username,
          photoURL: users.photoURL,
        },
      })
      .from(universityCourseComments)
      .innerJoin(users, eq(universityCourseComments.userId, users.id))
      .where(eq(universityCourseComments.courseId, courseId))
      .orderBy(desc(universityCourseComments.createdAt));
  }

  async createUniversityCourseComment(
    comment: InsertUniversityCourseComment
  ): Promise<UniversityCourseComment> {
    const [result] = await db
      .insert(universityCourseComments)
      .values(comment)
      .returning();
    return result;
  }

  async updateUniversityCourseComment(
    id: number,
    content: string
  ): Promise<UniversityCourseComment | undefined> {
    const [result] = await db
      .update(universityCourseComments)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(universityCourseComments.id, id))
      .returning();
    return result || undefined;
  }

  async deleteUniversityCourseComment(
    id: number,
    userId: number
  ): Promise<boolean> {
    const result = await db
      .delete(universityCourseComments)
      .where(
        and(
          eq(universityCourseComments.id, id),
          eq(universityCourseComments.userId, userId)
        )
      );
    return result.rowCount > 0;
  }

  // University Course Resources operations
  async getUniversityCourseResource(
    id: number
  ): Promise<UniversityCourseResource | undefined> {
    const [resource] = await db
      .select()
      .from(universityCourseResources)
      .where(eq(universityCourseResources.id, id));
    return resource || undefined;
  }

  async getUniversityCourseResourcesByCourseId(
    courseId: number
  ): Promise<UniversityCourseResource[]> {
    return await db
      .select({
        ...universityCourseResources,
        user: {
          id: users.id,
          username: users.username,
          photoURL: users.photoURL,
        },
      })
      .from(universityCourseResources)
      .innerJoin(users, eq(universityCourseResources.userId, users.id))
      .where(eq(universityCourseResources.courseId, courseId))
      .orderBy(desc(universityCourseResources.createdAt));
  }

  async createUniversityCourseResource(
    resource: InsertUniversityCourseResource
  ): Promise<UniversityCourseResource> {
    const [result] = await db
      .insert(universityCourseResources)
      .values(resource)
      .returning();
    return result;
  }

  async updateUniversityCourseResource(
    id: number,
    resource: Partial<InsertUniversityCourseResource>
  ): Promise<UniversityCourseResource | undefined> {
    const updatedFields = {
      ...resource,
      updatedAt: new Date(),
    };
    const [result] = await db
      .update(universityCourseResources)
      .set(updatedFields)
      .where(eq(universityCourseResources.id, id))
      .returning();
    return result || undefined;
  }

  async deleteUniversityCourseResource(
    id: number,
    userId: number
  ): Promise<boolean> {
    const result = await db
      .delete(universityCourseResources)
      .where(
        and(
          eq(universityCourseResources.id, id),
          eq(universityCourseResources.userId, userId)
        )
      );
    return result.rowCount > 0;
  }

  // University Course Collaborations operations
  async getUniversityCourseCollaboration(
    id: number
  ): Promise<UniversityCourseCollaboration | undefined> {
    const [collaboration] = await db
      .select()
      .from(universityCourseCollaborations)
      .where(eq(universityCourseCollaborations.id, id));
    return collaboration || undefined;
  }

  async getUniversityCourseCollaborationsByCourseId(
    courseId: number
  ): Promise<UniversityCourseCollaboration[]> {
    return await db
      .select({
        ...universityCourseCollaborations,
        user: {
          id: users.id,
          username: users.username,
          photoURL: users.photoURL,
        },
      })
      .from(universityCourseCollaborations)
      .innerJoin(users, eq(universityCourseCollaborations.userId, users.id))
      .where(eq(universityCourseCollaborations.courseId, courseId))
      .orderBy(desc(universityCourseCollaborations.createdAt));
  }

  async getUniversityCourseCollaborationsByUserId(
    userId: number
  ): Promise<UniversityCourseCollaboration[]> {
    return await db
      .select({
        ...universityCourseCollaborations,
        course: {
          id: universityCourses.id,
          university: universityCourses.university,
          courseDept: universityCourses.courseDept,
          courseNumber: universityCourses.courseNumber,
          courseTitle: universityCourses.courseTitle,
        },
      })
      .from(universityCourseCollaborations)
      .innerJoin(
        universityCourses,
        eq(universityCourseCollaborations.courseId, universityCourses.id)
      )
      .where(eq(universityCourseCollaborations.userId, userId))
      .orderBy(desc(universityCourseCollaborations.createdAt));
  }

  async createUniversityCourseCollaboration(
    collaboration: InsertUniversityCourseCollaboration
  ): Promise<UniversityCourseCollaboration> {
    const [result] = await db
      .insert(universityCourseCollaborations)
      .values(collaboration)
      .returning();
    return result;
  }

  async deleteUniversityCourseCollaboration(
    id: number,
    userId: number
  ): Promise<boolean> {
    const result = await db
      .delete(universityCourseCollaborations)
      .where(
        and(
          eq(universityCourseCollaborations.id, id),
          eq(universityCourseCollaborations.userId, userId)
        )
      );
    return result.rowCount > 0;
  }

  // Learning Methods operations
  async getLearningMethod(id: number): Promise<LearningMethod | undefined> {
    const [method] = await db
      .select()
      .from(learningMethods)
      .where(eq(learningMethods.id, id));
    return method || undefined;
  }

  async getLearningMethods(options?: {
    limit?: number;
    offset?: number;
    userId?: number;
    difficulty?: string;
    tag?: string;
    search?: string;
  }): Promise<LearningMethod[]> {
    let query = db.select().from(learningMethods);

    // Apply filters
    const whereConditions = [];

    if (options?.userId) {
      whereConditions.push(eq(learningMethods.userId, options.userId));
    }

    if (options?.difficulty) {
      whereConditions.push(eq(learningMethods.difficulty, options.difficulty));
    }

    if (options?.tag && learningMethods.tags) {
      whereConditions.push(arrayContains(learningMethods.tags, [options.tag]));
    }

    if (options?.search) {
      whereConditions.push(
        or(
          like(learningMethods.title, `%${options.search}%`),
          like(learningMethods.description, `%${options.search}%`)
        )
      );
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Apply default sorting - newest first, then by upvotes
    query = query.orderBy(
      desc(learningMethods.upvotes),
      desc(learningMethods.createdAt)
    );

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  async createLearningMethod(
    method: InsertLearningMethod
  ): Promise<LearningMethod> {
    const [result] = await db
      .insert(learningMethods)
      .values(method)
      .returning();
    return result;
  }

  async updateLearningMethod(
    id: number,
    method: Partial<InsertLearningMethod>
  ): Promise<LearningMethod | undefined> {
    const [result] = await db
      .update(learningMethods)
      .set(method)
      .where(eq(learningMethods.id, id))
      .returning();
    return result || undefined;
  }

  async deleteLearningMethod(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(learningMethods)
      .where(
        and(eq(learningMethods.id, id), eq(learningMethods.userId, userId))
      );
    return result.rowCount > 0;
  }

  async incrementLearningMethodViews(id: number): Promise<void> {
    await db
      .update(learningMethods)
      .set({
        views: sql`${learningMethods.views} + 1`,
      })
      .where(eq(learningMethods.id, id));
  }

  async incrementLearningMethodUpvotes(id: number): Promise<void> {
    await db
      .update(learningMethods)
      .set({
        upvotes: sql`${learningMethods.upvotes} + 1`,
      })
      .where(eq(learningMethods.id, id));
  }

  async getLearningMethodTags(): Promise<string[]> {
    const methods = await db
      .select({ tags: learningMethods.tags })
      .from(learningMethods);
    const allTags = new Set<string>();

    methods.forEach((method) => {
      if (method.tags && Array.isArray(method.tags)) {
        method.tags.forEach((tag) => allTags.add(tag));
      }
    });

    return Array.from(allTags).sort();
  }

  // Learning Method Comments operations
  async getLearningMethodComment(
    id: number
  ): Promise<LearningMethodComment | undefined> {
    const [comment] = await db
      .select()
      .from(learningMethodComments)
      .where(eq(learningMethodComments.id, id));
    return comment || undefined;
  }

  async getLearningMethodCommentsByMethodId(methodId: number): Promise<any[]> {
    try {
      // Get the comments
      const comments = await db
        .select()
        .from(learningMethodComments)
        .where(eq(learningMethodComments.methodId, methodId))
        .orderBy(desc(learningMethodComments.createdAt));

      // Fetch user information for each comment
      const commentsWithUserData = await Promise.all(
        comments.map(async (comment) => {
          const user = await this.getUser(comment.userId);

          if (!user) return { ...comment, user: null };

          // Remove sensitive user data
          const { password, ...userWithoutPassword } = user;
          return { ...comment, user: userWithoutPassword };
        })
      );

      return commentsWithUserData;
    } catch (error) {
      console.error("Error in getLearningMethodCommentsByMethodId:", error);
      return [];
    }
  }

  async createLearningMethodComment(
    comment: InsertLearningMethodComment
  ): Promise<LearningMethodComment> {
    const [result] = await db
      .insert(learningMethodComments)
      .values(comment)
      .returning();
    return result;
  }

  async updateLearningMethodComment(
    id: number,
    comment: Partial<InsertLearningMethodComment>
  ): Promise<LearningMethodComment | undefined> {
    const [result] = await db
      .update(learningMethodComments)
      .set(comment)
      .where(eq(learningMethodComments.id, id))
      .returning();
    return result || undefined;
  }

  async deleteLearningMethodComment(
    id: number,
    userId: number
  ): Promise<boolean> {
    const result = await db
      .delete(learningMethodComments)
      .where(
        and(
          eq(learningMethodComments.id, id),
          eq(learningMethodComments.userId, userId)
        )
      );
    return result.rowCount > 0;
  }

  // Learning Method Reviews operations
  async getLearningMethodReview(
    id: number
  ): Promise<LearningMethodReview | undefined> {
    const [review] = await db
      .select()
      .from(learningMethodReviews)
      .where(eq(learningMethodReviews.id, id));
    return review || undefined;
  }

  async getLearningMethodReviewsByMethodId(
    methodId: number
  ): Promise<LearningMethodReview[]> {
    return await db
      .select()
      .from(learningMethodReviews)
      .where(eq(learningMethodReviews.methodId, methodId))
      .orderBy(desc(learningMethodReviews.createdAt));
  }

  async createLearningMethodReview(
    review: InsertLearningMethodReview
  ): Promise<LearningMethodReview> {
    const [result] = await db
      .insert(learningMethodReviews)
      .values(review)
      .returning();
    return result;
  }

  async updateLearningMethodReview(
    id: number,
    review: Partial<InsertLearningMethodReview>
  ): Promise<LearningMethodReview | undefined> {
    const [result] = await db
      .update(learningMethodReviews)
      .set(review)
      .where(eq(learningMethodReviews.id, id))
      .returning();
    return result || undefined;
  }

  async deleteLearningMethodReview(
    id: number,
    userId: number
  ): Promise<boolean> {
    const result = await db
      .delete(learningMethodReviews)
      .where(
        and(
          eq(learningMethodReviews.id, id),
          eq(learningMethodReviews.userId, userId)
        )
      );
    return result.rowCount > 0;
  }

  // Learning Tools operations
  async getLearningTool(id: number): Promise<LearningTool | undefined> {
    const [tool] = await db
      .select()
      .from(learningTools)
      .where(eq(learningTools.id, id));
    return tool || undefined;
  }

  async getLearningTools(options?: {
    limit?: number;
    offset?: number;
    userId?: number;
    category?: string;
    pricing?: string;
    search?: string;
  }): Promise<LearningTool[]> {
    let query = db.select().from(learningTools);

    // Apply filters
    const whereConditions = [];

    if (options?.userId) {
      whereConditions.push(eq(learningTools.userId, options.userId));
    }

    if (options?.category) {
      whereConditions.push(eq(learningTools.category, options.category));
    }

    if (options?.pricing) {
      whereConditions.push(eq(learningTools.pricing, options.pricing));
    }

    if (options?.search) {
      whereConditions.push(
        or(
          like(learningTools.name, `%${options.search}%`),
          like(learningTools.description, `%${options.search}%`)
        )
      );
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Apply default sorting - most upvotes, then newest
    query = query.orderBy(
      desc(learningTools.upvotes),
      desc(learningTools.createdAt)
    );

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  async createLearningTool(tool: InsertLearningTool): Promise<LearningTool> {
    const [result] = await db.insert(learningTools).values(tool).returning();
    return result;
  }

  async updateLearningTool(
    id: number,
    tool: Partial<InsertLearningTool>
  ): Promise<LearningTool | undefined> {
    const [result] = await db
      .update(learningTools)
      .set(tool)
      .where(eq(learningTools.id, id))
      .returning();
    return result || undefined;
  }

  async deleteLearningTool(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(learningTools)
      .where(and(eq(learningTools.id, id), eq(learningTools.userId, userId)));
    return result.rowCount > 0;
  }

  async incrementLearningToolViews(id: number): Promise<void> {
    await db
      .update(learningTools)
      .set({
        views: sql`${learningTools.views} + 1`,
      })
      .where(eq(learningTools.id, id));
  }

  async incrementLearningToolUpvotes(id: number): Promise<void> {
    await db
      .update(learningTools)
      .set({
        upvotes: sql`${learningTools.upvotes} + 1`,
      })
      .where(eq(learningTools.id, id));
  }

  async getLearningToolCategories(): Promise<string[]> {
    const result = await db
      .selectDistinct({ category: learningTools.category })
      .from(learningTools);
    return result.map((row) => row.category).filter(Boolean);
  }

  // Learning Tool Reviews operations
  async getLearningToolReview(
    id: number
  ): Promise<LearningToolReview | undefined> {
    const [review] = await db
      .select()
      .from(learningToolReviews)
      .where(eq(learningToolReviews.id, id));
    return review || undefined;
  }

  async getLearningToolReviewsByToolId(
    toolId: number
  ): Promise<LearningToolReview[]> {
    return await db
      .select()
      .from(learningToolReviews)
      .where(eq(learningToolReviews.toolId, toolId))
      .orderBy(desc(learningToolReviews.createdAt));
  }

  async createLearningToolReview(
    review: InsertLearningToolReview
  ): Promise<LearningToolReview> {
    const [result] = await db
      .insert(learningToolReviews)
      .values(review)
      .returning();
    return result;
  }

  async updateLearningToolReview(
    id: number,
    review: Partial<InsertLearningToolReview>
  ): Promise<LearningToolReview | undefined> {
    const [result] = await db
      .update(learningToolReviews)
      .set(review)
      .where(eq(learningToolReviews.id, id))
      .returning();
    return result || undefined;
  }

  async deleteLearningToolReview(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(learningToolReviews)
      .where(
        and(
          eq(learningToolReviews.id, id),
          eq(learningToolReviews.userId, userId)
        )
      );
    return result.rowCount > 0;
  }

  // Chat Messages operations
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    const [message] = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.id, id));
    return message || undefined;
  }

  async getChatMessagesBetweenUsers(
    userId1: number,
    userId2: number,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<ChatMessage[]> {
    let query = db
      .select()
      .from(chatMessages)
      .where(
        or(
          and(
            eq(chatMessages.senderId, userId1),
            eq(chatMessages.receiverId, userId2)
          ),
          and(
            eq(chatMessages.senderId, userId2),
            eq(chatMessages.receiverId, userId1)
          )
        )
      )
      .orderBy(asc(chatMessages.createdAt));

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [result] = await db.insert(chatMessages).values(message).returning();
    return result;
  }

  async markChatMessagesAsRead(
    senderId: number,
    receiverId: number
  ): Promise<boolean> {
    // Mark all messages from sender to receiver as read
    const result = await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.senderId, senderId),
          eq(chatMessages.receiverId, receiverId),
          eq(chatMessages.isRead, false)
        )
      );

    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(chatMessages)
      .where(
        and(eq(chatMessages.receiverId, userId), eq(chatMessages.isRead, false))
      );

    return Number(result[0]?.count || 0);
  }

  async getChatPartners(userId: number): Promise<User[]> {
    // Get all unique users that the current user has chatted with
    const sentToUsers = await db
      .select({
        user: users,
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.receiverId, users.id))
      .where(eq(chatMessages.senderId, userId))
      .groupBy(users.id);

    const receivedFromUsers = await db
      .select({
        user: users,
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.receiverId, userId))
      .groupBy(users.id);

    // Combine and deduplicate users
    const uniqueUsers = new Map<number, User>();
    sentToUsers.forEach((u) => uniqueUsers.set(u.user.id, u.user));
    receivedFromUsers.forEach((u) => uniqueUsers.set(u.user.id, u.user));

    // Remove the current user from the list of chat partners
    uniqueUsers.delete(userId);

    return Array.from(uniqueUsers.values());
  }

  async getChatHistory(
    userId1: number,
    userId2: number,
    limit: number = 50,
    before?: number
  ): Promise<ChatMessage[]> {
    let query = db
      .select()
      .from(chatMessages)
      .where(
        or(
          and(
            eq(chatMessages.senderId, userId1),
            eq(chatMessages.receiverId, userId2)
          ),
          and(
            eq(chatMessages.senderId, userId2),
            eq(chatMessages.receiverId, userId1)
          )
        )
      );

    if (before) {
      query = query.where(sql`${chatMessages.id} < ${before}`);
    }

    const messages = await query
      .orderBy(asc(chatMessages.createdAt))
      .limit(limit);

    return messages;
  }

  async getUnreadMessagesForUser(userId: number): Promise<ChatMessage[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(
        and(eq(chatMessages.receiverId, userId), eq(chatMessages.isRead, false))
      )
      .orderBy(asc(chatMessages.createdAt));

    return messages;
  }

  async canUsersChat(userId1: number, userId2: number): Promise<boolean> {
    // For now, allow any users to chat with each other
    // In a real application, this might be restricted based on relationships
    return true;
  }

  // Import online courses directly from parsed CSV data
  async importOnlineCoursesFromParsedCSV(
    records: any[],
    userId: number
  ): Promise<number> {
    let importedCount = 0;
    const warnings: string[] = [];
    let processedCount = 0;

    const safeRecords = Array.isArray(records) ? records : [];
    if (safeRecords.length === 0) {
      console.log("No records to import for online courses");
      return 0;
    }

    // Begin transaction
    const dbClient = await this.getClient();

    try {
      await dbClient.query("BEGIN");
      console.log(
        `Starting transaction to import ${safeRecords.length} online courses`
      );

      // Process each record
      for (const record of safeRecords) {
        processedCount++;
        try {
          // Check for required fields with normalized field names
          const title =
            record.title ||
            record.name ||
            record["course title"] ||
            record["Course Title"];
          const url =
            record.url ||
            record.link ||
            record["course url"] ||
            record["Course URL"];

          // Title and URL are required for online courses
          if (!title) {
            warnings.push(
              `Skipped record #${processedCount}: Missing title field`
            );
            console.log(
              `Skipping record #${processedCount} due to missing title: ${JSON.stringify(
                record
              )}`
            );
            continue;
          }

          if (!url) {
            warnings.push(
              `Skipped record #${processedCount}: Missing URL field`
            );
            console.log(
              `Skipping record #${processedCount} due to missing URL: ${JSON.stringify(
                record
              )}`
            );
            continue;
          }

          // Map CSV record to database schema with proper type handling and value normalization
          const courseData = {
            title: title.substring(0, 255),
            url: url.substring(0, 2048),
            shortIntro: (
              record.shortIntro ||
              record.description ||
              record.intro ||
              ""
            )?.substring(0, 2000),
            category: record.category?.substring(0, 100) || null,
            subCategory: (
              record.subCategory ||
              record.subcategory ||
              null
            )?.substring(0, 100),
            courseType: (record.courseType || record.type || null)?.substring(
              0,
              50
            ),
            language: record.language?.substring(0, 50) || null,
            subtitleLanguages: (
              record.subtitleLanguages ||
              record.subtitles ||
              null
            )?.substring(0, 255),
            skills: (record.skills || null)?.substring(0, 255),
            instructors: (
              record.instructors ||
              record.instructor ||
              null
            )?.substring(0, 255),
            rating: record.rating ? parseFloat(record.rating) : null,
            numberOfViewers:
              record.numberOfViewers || record.viewers
                ? parseInt(record.numberOfViewers || record.viewers, 10) || null
                : null,
            duration: (record.duration || null)?.substring(0, 50),
            site: (record.site || record.platform || null)?.substring(0, 100),
            imageUrl: (record.imageUrl || record.image || null)?.substring(
              0,
              2048
            ),
            createdBy: userId,
            // Set a timestamp for created_at
            createdAt: new Date().toISOString(),
          };

          // Log each course being imported
          console.log(
            `Importing online course (${processedCount}/${safeRecords.length}):`,
            {
              title: courseData.title,
              url:
                courseData.url.substring(0, 50) +
                (courseData.url.length > 50 ? "..." : ""),
              category: courseData.category,
            }
          );

          // Insert course
          const result = await dbClient.query(
            `INSERT INTO courses (
              title, url, short_intro, category, sub_category, course_type, language, 
              subtitle_languages, skills, instructors, rating, number_of_viewers, 
              duration, site, image_url, created_by, created_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
            ) RETURNING id`,
            [
              courseData.title,
              courseData.url,
              courseData.shortIntro,
              courseData.category,
              courseData.subCategory,
              courseData.courseType,
              courseData.language,
              courseData.subtitleLanguages,
              courseData.skills,
              courseData.instructors,
              courseData.rating,
              courseData.numberOfViewers,
              courseData.duration,
              courseData.site,
              courseData.imageUrl,
              courseData.createdBy,
              courseData.createdAt,
            ]
          );

          if (result.rows && result.rows.length > 0) {
            importedCount++;
          }
        } catch (recordError) {
          console.error(
            `Error importing online course record #${processedCount}:`,
            recordError,
            "Record data:",
            JSON.stringify(record)
          );
          warnings.push(
            `Error importing online course #${processedCount}: ${
              (recordError as Error).message
            }`
          );
        }
      }

      // Commit transaction
      await dbClient.query("COMMIT");
      console.log(
        `Transaction complete. Successfully imported ${importedCount}/${safeRecords.length} online courses`
      );

      if (warnings.length > 0) {
        console.log(`Import warnings (${warnings.length}):`, warnings);
      }

      return importedCount;
    } catch (error) {
      // Rollback on error
      await dbClient.query("ROLLBACK");
      console.error("Error in importOnlineCoursesFromParsedCSV:", error);
      throw error;
    } finally {
      dbClient.release();
    }
  }

  // Import university courses directly from parsed CSV data
  async importUniversityCoursesFromParsedCSV(
    records: any[],
    userId: number
  ): Promise<{
    importedCount: number;
    warnings: string[];
    failedRecords: Array<{ record: any; error: string }>;
    totalRecords: number;
  }> {
    let importedCount = 0;
    const warnings: string[] = [];
    const failedRecords: Array<{ record: any; error: string }> = [];
    let processedCount = 0;
    let totalRecords = 0;

    const safeRecords = Array.isArray(records) ? records : [];
    totalRecords = safeRecords.length;

    if (safeRecords.length === 0) {
      console.log("No records to import for university courses");
      return {
        importedCount: 0,
        warnings: ["No valid records found to import in the CSV file."],
        failedRecords: [],
        totalRecords,
      };
    }

    // Validate that records isn't just an empty array with headers
    if (safeRecords.length === 1 && Object.keys(safeRecords[0]).length === 0) {
      console.log("CSV contains headers but no data rows");
      return {
        importedCount: 0,
        warnings: ["CSV file contains headers but no data rows."],
        failedRecords: [],
        totalRecords: 0,
      };
    }

    // Check if required column headers exist in the first record
    const firstRecord = safeRecords[0];
    const requiredColumns = [
      "course_title",
      "university",
      "course_dept",
      "course_number",
    ];
    const missingColumns = requiredColumns.filter((col) => {
      const normalized = col.replace(/_/g, "").toLowerCase();
      // Check both with and without underscores, camelCase or regular
      return !Object.keys(firstRecord).some(
        (key) => key.replace(/_/g, "").toLowerCase() === normalized
      );
    });

    if (missingColumns.length > 0) {
      console.error(
        `CSV is missing required columns: ${missingColumns.join(", ")}`
      );
      warnings.push(
        `CSV is missing required columns: ${missingColumns.join(", ")}`
      );
      return {
        importedCount: 0,
        warnings,
        failedRecords: [
          {
            record: firstRecord,
            error: `Missing required columns: ${missingColumns.join(", ")}`,
          },
        ],
        totalRecords,
      };
    }

    console.log(`Starting to import ${safeRecords.length} university courses`);

    // Process each record in its own transaction
    for (const record of safeRecords) {
      processedCount++;
      // Get a new client for each record to prevent transaction aborts affecting other imports
      const dbClient = await this.getClient();

      try {
        await dbClient.query("BEGIN");

        // Check for required and normalized fields first
        const title =
          record.course_title ||
          record.courseTitle ||
          record.title ||
          record["course title"] ||
          record["Course Title"];
        const university =
          record.university ||
          record.school ||
          record.institution ||
          record["University"];
        const courseDept =
          record.course_dept ||
          record.courseDept ||
          record.department ||
          record.dept ||
          record["Department"] ||
          record["Dept"];
        const courseNumber =
          record.course_number ||
          record.courseNumber ||
          record.courseCode ||
          record.code ||
          record["Course Number"] ||
          record["Course Code"];

        // Log normalized fields for debugging
        console.log(`Record #${processedCount} normalized fields:`, {
          title,
          university,
          courseDept,
          courseNumber,
        });

        // Skip records missing essential fields
        if (!title) {
          warnings.push(
            `Skipped record #${processedCount}: Missing title field`
          );
          console.log(
            `Skipping record #${processedCount} due to missing title: ${JSON.stringify(
              record
            )}`
          );
          failedRecords.push({ record, error: "Missing title field" });
          await dbClient.query("COMMIT"); // Commit empty transaction
          continue;
        }

        if (!university) {
          warnings.push(
            `Warning for record #${processedCount}: Missing university/school field`
          );
        }

        if (!courseDept) {
          warnings.push(
            `Warning for record #${processedCount}: Missing department field`
          );
        }

        if (!courseNumber) {
          warnings.push(
            `Warning for record #${processedCount}: Missing course number field`
          );
        }

        // Check for duplicate courses before inserting
        try {
          const duplicateCheckResult = await dbClient.query(
            `SELECT id FROM university_courses 
             WHERE university = $1 AND course_dept = $2 AND course_number = $3`,
            [
              (university || "Unknown")?.substring(0, 100),
              (courseDept || "General")?.substring(0, 50),
              (courseNumber || "")?.substring(0, 20),
            ]
          );

          if (duplicateCheckResult.rowCount > 0) {
            warnings.push(
              `Skipped record #${processedCount}: Course already exists in database`
            );
            console.log(
              `Skipping record #${processedCount} as it's a duplicate: ${university} ${courseDept} ${courseNumber}`
            );
            failedRecords.push({
              record,
              error: `Duplicate course: ${university} ${courseDept} ${courseNumber} already exists`,
            });
            await dbClient.query("COMMIT"); // Commit empty transaction
            continue;
          }
        } catch (duplicateError) {
          console.error(
            `Error checking for duplicates in record #${processedCount}:`,
            duplicateError
          );
          // Continue with insert attempt despite duplicate check error
        }

        // Map CSV record to database schema with fallbacks and field normalization
        const courseData = {
          university: (university || "Unknown")?.substring(0, 100),
          courseDept: (courseDept || "General")?.substring(0, 50),
          courseNumber: (courseNumber || "")?.substring(0, 20),
          courseTitle: title.substring(0, 255),
          description: (
            record.description ||
            record.shortIntro ||
            record.intro ||
            ""
          )?.substring(0, 2000),
          professors: (
            record.professors ||
            record.professor ||
            record.instructors ||
            ""
          )?.substring(0, 255),
          recentSemesters: (
            record.recentSemesters ||
            record.recent_semesters ||
            record.semesters ||
            record.semester ||
            ""
          )?.substring(0, 255),
          credits: record.credits || null,
          url: record.url ? record.url.substring(0, 2048) : null,
          // Set a timestamp for created_at
          createdAt: new Date().toISOString(),
        };

        console.log(
          `Importing university course (${processedCount}/${safeRecords.length}):`,
          {
            title: courseData.courseTitle,
            university: courseData.university,
            department: courseData.courseDept,
            courseNumber: courseData.courseNumber,
          }
        );

        // Insert into the database
        try {
          // First create the course
          const insertQuery = `
            INSERT INTO university_courses 
            (university, course_dept, course_number, course_title, description, professors, recent_semesters, credits, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`;

          const insertParams = [
            courseData.university,
            courseData.courseDept,
            courseData.courseNumber,
            courseData.courseTitle,
            courseData.description,
            courseData.professors,
            courseData.recentSemesters,
            courseData.credits,
            courseData.createdAt,
          ];

          console.log(
            `Executing insert query for record #${processedCount} with params:`,
            insertParams
          );

          const queryResult = await dbClient.query(insertQuery, insertParams);

          const courseId = queryResult.rows[0]?.id;

          if (!courseId) {
            throw new Error("Failed to get ID from newly inserted course");
          }

          // Then add the URL if available
          if (courseData.url && courseId) {
            await dbClient.query(
              `INSERT INTO university_course_links 
              (course_id, url, title, description, created_at) 
              VALUES ($1, $2, $3, $4, $5)`,
              [
                courseId,
                courseData.url,
                "Course Link",
                "Imported from CSV",
                new Date().toISOString(),
              ]
            );
          }

          await dbClient.query("COMMIT");
          importedCount++;
          console.log(`Successfully imported record #${processedCount}`);
        } catch (dbError) {
          await dbClient.query("ROLLBACK");
          const errorMessage =
            dbError instanceof Error ? dbError.message : String(dbError);

          console.error(
            `Failed to insert record #${processedCount}:`,
            errorMessage
          );
          warnings.push(
            `Error inserting record #${processedCount}: ${errorMessage}`
          );
          failedRecords.push({
            record,
            error: errorMessage,
          });
        }
      } catch (recordError) {
        // Ensure transaction is rolled back even for processing errors
        try {
          await dbClient.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "Error during rollback for record error:",
            rollbackError
          );
        }

        const errorMessage =
          recordError instanceof Error
            ? recordError.message
            : String(recordError);

        console.error(
          `Error processing record #${processedCount}:`,
          errorMessage
        );
        warnings.push(
          `Error processing record #${processedCount}: ${errorMessage}`
        );
        failedRecords.push({
          record,
          error: errorMessage,
        });
      } finally {
        // Always release the client back to the pool
        try {
          dbClient.release();
        } catch (releaseError) {
          console.error("Error releasing database client:", releaseError);
        }
      }
    }

    console.log(
      `Import complete. Successfully imported ${importedCount} out of ${safeRecords.length} university courses`
    );

    return { importedCount, warnings, failedRecords, totalRecords };
  }

  // In the implementation add this function:
  async getRecentChatPartners(userId: number): Promise<number[]> {
    try {
      console.log(`Finding chat partners for user ${userId}`);
      // Find all users who have exchanged messages with this user
      const result = await this.db.query.chatMessages.findMany({
        where: or(
          eq(chatMessages.senderId, userId),
          eq(chatMessages.receiverId, userId)
        ),
        orderBy: desc(chatMessages.createdAt),
      });

      console.log(`Found ${result.length} chat messages for user ${userId}`);

      // Extract unique partner IDs
      const partnerIds = new Set<number>();

      for (const message of result) {
        if (message.senderId === userId) {
          partnerIds.add(message.receiverId);
        } else {
          partnerIds.add(message.senderId);
        }
      }

      const partners = Array.from(partnerIds);
      console.log(
        `Extracted ${partners.length} unique chat partners for user ${userId}`
      );
      return partners;
    } catch (error) {
      console.error("Error getting recent chat partners:", error);
      return [];
    }
  }

  // Add the implementation for group chat messages
  async createGroupChatMessage(message: {
    senderId: number;
    groupId: number;
    content: string;
    createdAt: Date;
    status?: string;
  }): Promise<any> {
    let client;
    try {
      client = await this.getClient();
      // Insert into group_messages table using parameterized query
      const insertQuery = `
        INSERT INTO group_messages (
          sender_id, 
          group_id, 
          content, 
          created_at
        ) 
        VALUES ($1, $2, $3, $4)
        RETURNING id, sender_id as "senderId", group_id as "groupId", content, created_at as "createdAt";
      `;
      const insertParams = [
        message.senderId,
        message.groupId,
        message.content,
        message.createdAt,
      ];
      const result = await client.query(insertQuery, insertParams);
      console.log("Group message insert result:", result);
      if (!result || !result.rows || result.rows.length === 0) {
        console.error("Group message insert result (no rows):", result);
        throw new Error("Failed to create group chat message");
      }
      return result.rows[0];
    } catch (error) {
      console.error("Error creating group chat message:", error);
      throw error;
    } finally {
      if (client) {
        try {
          client.release();
        } catch (releaseError) {
          console.error(
            "Error releasing database client after group message insert:",
            releaseError
          );
        }
      }
    }
  }
}

export const storage = new DatabaseStorage();
