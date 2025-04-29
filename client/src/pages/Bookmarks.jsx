import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import CourseCard from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bookmark, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Bookmarks() {
  const { isAuthenticated, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState("newest");
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to view your bookmarks",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, toast]);

  // Fetch bookmarked courses
  const { data: bookmarks = [], isLoading, error } = useQuery({
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

  // Handle bookmark removal
  const handleBookmarkChange = (courseId, isBookmarked) => {
    if (!isBookmarked) {
      // Invalidate bookmarks query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
    }
  };

  // Handle sort change
  const handleSortChange = (value) => {
    setSortBy(value);
  };

  // Sort bookmarks based on the selected option
  const sortedBookmarks = [...bookmarks].sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title);
      case "highest_rated":
        return (b.rating || 0) - (a.rating || 0);
      case "most_popular":
        return (b.numberOfViewers || 0) - (a.numberOfViewers || 0);
      case "newest":
      default:
        // Use ID as a proxy for recency since we don't have createdAt for courses
        return b.id - a.id;
    }
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Bookmarks</h1>
          <p className="text-gray-600">Your saved courses for later reference</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex justify-between items-center">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-40" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
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
      </div>
    );
  }

  // Unauthenticated state
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
          <Bookmark className="h-12 w-12 mx-auto mb-4 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Sign In</h2>
          <p className="text-gray-600 mb-6">
            Sign in to view and manage your bookmarked courses
          </p>
          <Button
            onClick={() => document.querySelector('button[data-event="click:openLoginModal"]')?.click()}
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Bookmarks</h2>
          <p className="text-gray-600 mb-6">
            We encountered an error while loading your bookmarks. Please try again later.
          </p>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] })}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (bookmarks.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Bookmarks</h1>
          <p className="text-gray-600">Your saved courses for later reference</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Bookmark className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Bookmarks Yet</h2>
          <p className="text-gray-600 mb-6">
            Start bookmarking courses you're interested in, and they'll appear here for easy access.
          </p>
          <Button onClick={() => window.location.href = "/"}>
            Browse Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Bookmarks</h1>
        <p className="text-gray-600">Your saved courses for later reference</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div className="text-gray-700 font-medium">
          {bookmarks.length} {bookmarks.length === 1 ? "course" : "courses"} bookmarked
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">Sort by:</span>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="title">Title (A-Z)</SelectItem>
              <SelectItem value="highest_rated">Highest Rated</SelectItem>
              <SelectItem value="most_popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedBookmarks.map((course) => (
          <CourseCard 
            key={course.id} 
            course={course} 
            bookmarked={true}
            onBookmarkChange={handleBookmarkChange}
          />
        ))}
      </div>
    </div>
  );
}
