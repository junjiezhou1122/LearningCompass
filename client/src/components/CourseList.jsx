import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import CourseCard from "./CourseCard";
import { Skeleton } from "@/components/ui/skeleton";

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
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array(limit).fill(0).map((_, i) => (
          <div key={i} className="flex flex-col h-full">
            <Skeleton className="h-40 w-full" />
            <div className="p-4">
              <div className="flex gap-2 mb-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-4/5 mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-600">We couldn't load the courses. Please try again later.</p>
      </div>
    );
  }

  // Render empty state
  if (courses.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
        <p className="text-gray-600">Try adjusting your filters or search query.</p>
      </div>
    );
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
