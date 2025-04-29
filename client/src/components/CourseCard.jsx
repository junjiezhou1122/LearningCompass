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
        const response = await apiRequest("DELETE", `/api/bookmarks/${course.id}`, null, token);
        
        if (response.status === 204) {
          setIsBookmarked(false);
          toast({
            title: "Bookmark removed",
            description: `${course.title} has been removed from your bookmarks`,
          });
          
          // Call the callback if provided
          if (onBookmarkChange) {
            onBookmarkChange(course.id, false);
          }
        } else {
          throw new Error("Failed to remove bookmark");
        }
      } else {
        // Add bookmark
        const response = await apiRequest("POST", "/api/bookmarks", {
          courseId: course.id
        }, token);
        
        if (response.status === 201) {
          setIsBookmarked(true);
          toast({
            title: "Bookmark added",
            description: `${course.title} has been added to your bookmarks`,
          });
          
          // Call the callback if provided
          if (onBookmarkChange) {
            onBookmarkChange(course.id, true);
          }
        } else if (response.status === 409) {
          // Bookmark already exists
          setIsBookmarked(true);
          toast({
            title: "Already bookmarked",
            description: `${course.title} is already in your bookmarks`,
          });
        } else {
          throw new Error("Failed to add bookmark");
        }
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
      className={`course-card overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-md hover:-translate-y-1 rounded-xl ${isBookmarked ? 'border-[#4264f0]/20 shadow-md shadow-[#4264f0]/10' : 'border-gray-200'}`}
      onClick={handleCardClick}
    >
      <div className="relative">
        <img 
          src={course.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=225&q=80"} 
          alt={course.title} 
          className="w-full h-48 object-cover"
        />
        <Button
          size="icon"
          variant={isBookmarked ? "default" : "ghost"}
          className={`absolute top-3 right-3 rounded-full h-9 w-9 z-10 transition-all duration-300 hover:scale-110 
                    ${isBookmarked 
                      ? 'bg-[#4264f0] text-white shadow-lg hover:bg-[#3755d6]' 
                      : 'bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200'}`}
          onClick={handleBookmarkToggle}
          disabled={isPending}
        >
          <Bookmark 
            className={`h-4 w-4 ${isBookmarked ? 'fill-white text-white' : 'text-gray-600'}`} 
          />
          {isPending && <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          </span>}
        </Button>
        {course.courseType && (
          <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-md backdrop-blur-sm">
            {course.courseType}
          </div>
        )}
      </div>
      
      <CardContent className="p-5 flex-grow">
        <div className="flex flex-wrap gap-2 mb-3">
          {course.category && (
            <Badge variant="secondary" className="bg-[#EEF2FF] text-[#4264f0] hover:bg-[#E0E7FF] border-0">
              {course.category}
            </Badge>
          )}
          {course.subCategory && (
            <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">
              {course.subCategory}
            </Badge>
          )}
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {course.title}
        </h3>
        
        {course.shortIntro && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {truncateText(course.shortIntro, 100)}
          </p>
        )}
        
        {course.instructors && (
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <User className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium">{truncateText(course.instructors, 30)}</span>
          </div>
        )}
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          {course.duration && (
            <div className="flex items-center mr-4">
              <Clock className="h-4 w-4 mr-2 text-gray-400" />
              <span>{course.duration}</span>
            </div>
          )}
          {course.language && (
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-2 text-gray-400" />
              <span>{course.language}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="border-t border-gray-100 px-5 py-4 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center">
          <StarRating rating={course.rating || 0} />
          <span className="ml-2 text-sm font-medium text-gray-700">
            {course.rating?.toFixed(1) || "N/A"}
          </span>
          {course.numberOfViewers && (
            <span className="ml-1 text-xs text-gray-500">
              ({new Intl.NumberFormat().format(course.numberOfViewers)})
            </span>
          )}
        </div>
        
        {course.site && (
          <div className="text-sm font-semibold text-[#4264f0]">
            {course.site}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
