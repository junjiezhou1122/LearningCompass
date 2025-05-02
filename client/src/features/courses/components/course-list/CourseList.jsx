import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import CourseCard from "./CourseCard";
import CourseListSkeleton from "./CourseListSkeleton";
import CourseListEmpty from "./CourseListEmpty";
import CourseListError from "./CourseListError";

export default function CourseList({ 
  filters = {}, 
  searchQuery = "", 
  sortBy = "recommended",
  limit = 6,
  page = 1
}) {
  const { isAuthenticated, token } = useAuth();
  
  // Fetch bookmarks if authenticated
  const { data: bookmarks = [] } = useQuery({
    queryKey: ['/api/bookmarks'],
    queryFn: async ({ queryKey }) => {
      if (!isAuthenticated) return [];
      
      const response = await fetch(queryKey[0], {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error("Failed to fetch bookmarks");
      }
      
      return response.json();
    },
    enabled: isAuthenticated
  });

  // Build query parameters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (searchQuery) {
      params.append("search", searchQuery);
    }
    
    if (sortBy) {
      params.append("sortBy", sortBy);
    }
    
    if (limit) {
      params.append("limit", limit.toString());
    }
    
    // Calculate offset based on page number and limit
    if (page > 1) {
      const offset = (page - 1) * limit;
      params.append("offset", offset.toString());
    }
    
    // Add filter parameters
    if (filters.category) {
      params.append("category", filters.category);
    }
    
    if (filters.subCategory) {
      params.append("subCategory", filters.subCategory);
    }
    
    if (filters.courseType) {
      params.append("courseType", filters.courseType);
    }
    
    if (filters.language) {
      params.append("language", filters.language);
    }
    
    if (filters.rating) {
      params.append("rating", filters.rating.toString());
    }
    
    return params.toString();
  };

  // Fetch courses based on filters, search, and sort
  const { data: courses = [], isLoading, error } = useQuery({
    // Use array format for query key to properly handle cache invalidation
    queryKey: ['/api/courses', page, limit, sortBy, searchQuery, ...Object.values(filters)],
    queryFn: async () => {
      const response = await fetch(`/api/courses?${buildQueryParams()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      
      return response.json();
    }
  });

  // Check if a course is bookmarked
  const isBookmarked = (courseId) => {
    return bookmarks.some(bookmark => bookmark.id === courseId);
  };

  // Render loading state
  if (isLoading) {
    return <CourseListSkeleton limit={limit} />;
  }

  // Render error state
  if (error) {
    return <CourseListError />;
  }

  // Render empty state
  if (courses.length === 0) {
    return <CourseListEmpty />;
  }

  // Render courses
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard 
          key={course.id} 
          course={course} 
          bookmarked={isBookmarked(course.id)} 
        />
      ))}
    </div>
  );
}
