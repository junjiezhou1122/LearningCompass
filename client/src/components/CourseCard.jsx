import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, User, Clock, Globe } from "lucide-react";
import StarRating from "./StarRating";
import { truncateText, extractSkills } from "@/lib/utils";

export default function CourseCard({ course, bookmarked = false, onBookmarkChange }) {
  const [isBookmarked, setIsBookmarked] = useState(bookmarked);
  const [isPending, setIsPending] = useState(false);
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Update bookmarked state if prop changes
  useEffect(() => {
    setIsBookmarked(bookmarked);
  }, [bookmarked]);

  // Handle bookmark toggle
  const handleBookmarkToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to bookmark courses",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsPending(true);
      
      // Get the authentication token from localStorage
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please login again to bookmark courses",
          variant: "destructive",
        });
        return;
      }
      
      if (isBookmarked) {
        // Remove bookmark
        await apiRequest("DELETE", `/api/bookmarks/${course.id}`, null, token);
        setIsBookmarked(false);
        toast({
          title: "Bookmark removed",
          description: `${course.title} has been removed from your bookmarks`,
        });
      } else {
        // Add bookmark
        await apiRequest("POST", "/api/bookmarks", {
          courseId: course.id
        }, token);
        setIsBookmarked(true);
        toast({
          title: "Bookmark added",
          description: `${course.title} has been added to your bookmarks`,
        });
      }
      
      // Call the callback if provided
      if (onBookmarkChange) {
        onBookmarkChange(course.id, !isBookmarked);
      }
    } catch (error) {
      console.error("Bookmark error:", error);
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  // Handle card click to navigate to course detail
  const handleCardClick = () => {
    navigate(`/course/${course.id}`);
  };

  // Extract skills to display as badges
  const skills = extractSkills(course.skills, 2);

  return (
    <Card 
      className="course-card overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-md hover:-translate-y-1"
      onClick={handleCardClick}
    >
      <div className="relative">
        <img 
          src={course.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=225&q=80"} 
          alt={course.title} 
          className="w-full h-40 object-cover"
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 bg-white rounded-full h-8 w-8 shadow-md transition-transform duration-300 hover:scale-110"
          onClick={handleBookmarkToggle}
          disabled={isPending}
        >
          <Bookmark 
            className={`h-4 w-4 ${isBookmarked ? 'fill-accent-500 text-accent-500' : 'text-gray-400'}`} 
          />
        </Button>
        {course.courseType && (
          <div className="absolute bottom-0 left-0 bg-primary-600 text-white text-xs font-bold px-2 py-1">
            {course.courseType}
          </div>
        )}
      </div>
      
      <CardContent className="p-4 flex-grow">
        <div className="flex flex-wrap gap-2 mb-2">
          {course.category && (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
              {course.category}
            </Badge>
          )}
          {course.subCategory && (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
              {course.subCategory}
            </Badge>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
          {course.title}
        </h3>
        
        {course.shortIntro && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {truncateText(course.shortIntro, 100)}
          </p>
        )}
        
        {course.instructors && (
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <User className="h-4 w-4 mr-1 text-gray-400" />
            <span>{truncateText(course.instructors, 30)}</span>
          </div>
        )}
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          {course.duration && (
            <>
              <Clock className="h-4 w-4 mr-1 text-gray-400" />
              <span>{course.duration}</span>
              <span className="mx-2">•</span>
            </>
          )}
          {course.language && (
            <>
              <Globe className="h-4 w-4 mr-1 text-gray-400" />
              <span>{course.language}</span>
            </>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center">
          <StarRating rating={course.rating || 0} />
          <span className="ml-1 text-sm font-medium text-gray-700">
            {course.rating?.toFixed(1) || "N/A"}
          </span>
          {course.numberOfViewers && (
            <span className="ml-1 text-xs text-gray-500">
              ({new Intl.NumberFormat().format(course.numberOfViewers)})
            </span>
          )}
        </div>
        
        {course.site && (
          <div className="text-sm font-medium text-gray-900">
            {course.site}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
