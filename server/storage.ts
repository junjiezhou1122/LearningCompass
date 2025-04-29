import { users, courses, bookmarks, searchHistory, type User, type InsertUser, type Course, type InsertCourse, type Bookmark, type InsertBookmark, type SearchHistory, type InsertSearchHistory } from "@shared/schema";

// Storage interface
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private bookmarks: Map<string, Bookmark>;
  private searchHistories: Map<number, SearchHistory>;
  private userCurrentId: number;
  private courseCurrentId: number;
  private bookmarkCurrentId: number;
  private searchHistoryCurrentId: number;
  
  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.bookmarks = new Map();
    this.searchHistories = new Map();
    this.userCurrentId = 1;
    this.courseCurrentId = 1;
    this.bookmarkCurrentId = 1;
    this.searchHistoryCurrentId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
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
    let filteredCourses = Array.from(this.courses.values());
    
    // Apply filters
    if (options?.category) {
      filteredCourses = filteredCourses.filter(
        course => course.category?.toLowerCase() === options.category?.toLowerCase()
      );
    }
    
    if (options?.subCategory) {
      filteredCourses = filteredCourses.filter(
        course => course.subCategory?.toLowerCase() === options.subCategory?.toLowerCase()
      );
    }
    
    if (options?.courseType) {
      filteredCourses = filteredCourses.filter(
        course => course.courseType?.toLowerCase() === options.courseType?.toLowerCase()
      );
    }
    
    if (options?.language) {
      filteredCourses = filteredCourses.filter(
        course => course.language?.toLowerCase() === options.language?.toLowerCase()
      );
    }
    
    if (options?.rating) {
      filteredCourses = filteredCourses.filter(
        course => course.rating !== undefined && course.rating >= options.rating
      );
    }
    
    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      filteredCourses = filteredCourses.filter(
        course => 
          course.title.toLowerCase().includes(searchLower) ||
          (course.shortIntro && course.shortIntro.toLowerCase().includes(searchLower)) ||
          (course.skills && course.skills.toLowerCase().includes(searchLower)) ||
          (course.category && course.category.toLowerCase().includes(searchLower)) ||
          (course.subCategory && course.subCategory.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply sorting
    if (options?.sortBy) {
      switch (options.sortBy) {
        case 'highest_rated':
          filteredCourses.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'most_popular':
          filteredCourses.sort((a, b) => (b.numberOfViewers || 0) - (a.numberOfViewers || 0));
          break;
        case 'newest':
          // Since we don't have a 'created_at' field for courses, we'll use ID as a proxy for recency
          filteredCourses.sort((a, b) => b.id - a.id);
          break;
        default:
          // 'recommended' - no particular sorting, use default
          break;
      }
    }
    
    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || filteredCourses.length;
    
    return filteredCourses.slice(offset, offset + limit);
  }

  async getCoursesByIds(ids: number[]): Promise<Course[]> {
    return ids
      .map(id => this.courses.get(id))
      .filter((course): course is Course => course !== undefined);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.courseCurrentId++;
    const course: Course = { ...insertCourse, id };
    this.courses.set(id, course);
    return course;
  }

  async getCategories(): Promise<string[]> {
    const categories = new Set<string>();
    Array.from(this.courses.values()).forEach(course => {
      if (course.category) {
        categories.add(course.category);
      }
    });
    return Array.from(categories);
  }

  async getSubCategories(): Promise<string[]> {
    const subCategories = new Set<string>();
    Array.from(this.courses.values()).forEach(course => {
      if (course.subCategory) {
        subCategories.add(course.subCategory);
      }
    });
    return Array.from(subCategories);
  }

  async getCourseTypes(): Promise<string[]> {
    const courseTypes = new Set<string>();
    Array.from(this.courses.values()).forEach(course => {
      if (course.courseType) {
        courseTypes.add(course.courseType);
      }
    });
    return Array.from(courseTypes);
  }

  async getLanguages(): Promise<string[]> {
    const languages = new Set<string>();
    Array.from(this.courses.values()).forEach(course => {
      if (course.language) {
        languages.add(course.language);
      }
    });
    return Array.from(languages);
  }

  async getSkills(): Promise<string[]> {
    const skills = new Set<string>();
    Array.from(this.courses.values()).forEach(course => {
      if (course.skills) {
        const courseSkills = course.skills.split(',').map(skill => skill.trim());
        courseSkills.forEach(skill => {
          if (skill) skills.add(skill);
        });
      }
    });
    return Array.from(skills);
  }

  // Bookmark operations
  async getBookmark(userId: number, courseId: number): Promise<Bookmark | undefined> {
    const key = `${userId}-${courseId}`;
    return this.bookmarks.get(key);
  }

  async getBookmarksByUserId(userId: number): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values()).filter(
      bookmark => bookmark.userId === userId
    );
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = this.bookmarkCurrentId++;
    const bookmark: Bookmark = { ...insertBookmark, id };
    const key = `${bookmark.userId}-${bookmark.courseId}`;
    this.bookmarks.set(key, bookmark);
    return bookmark;
  }

  async deleteBookmark(userId: number, courseId: number): Promise<boolean> {
    const key = `${userId}-${courseId}`;
    return this.bookmarks.delete(key);
  }

  // Search history operations
  async createSearchHistory(insertSearchHistory: InsertSearchHistory): Promise<SearchHistory> {
    const id = this.searchHistoryCurrentId++;
    const searchHistory: SearchHistory = { ...insertSearchHistory, id };
    this.searchHistories.set(id, searchHistory);
    return searchHistory;
  }

  async getSearchHistoryByUserId(userId: number): Promise<SearchHistory[]> {
    return Array.from(this.searchHistories.values()).filter(
      history => history.userId === userId
    );
  }
}

export const storage = new MemStorage();
