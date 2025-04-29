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
      className={`course-card overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-sm hover:-translate-y-1 rounded-xl ${isBookmarked ? 'border-[#4264f0]/20 shadow-sm' : 'border-gray-100'}`}
      onClick={handleCardClick}
    >
      <div className="relative">
        <img 
          src={course.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=225&q=80"} 
          alt={course.title} 
          className="w-full h-44 object-cover"
        />
        <Button
          size="icon"
          variant={isBookmarked ? "default" : "ghost"}
          className={`absolute top-3 right-3 rounded-full h-8 w-8 z-10 transition-all duration-300 
                    ${isBookmarked 
                      ? 'bg-[#4264f0] text-white shadow-sm hover:bg-[#3755d6]' 
                      : 'bg-white/90 backdrop-blur-sm hover:bg-gray-50 border border-gray-100'}`}
          onClick={handleBookmarkToggle}
          disabled={isPending}
        >
          <Bookmark 
            className={`h-4 w-4 ${isBookmarked ? 'fill-white text-white' : 'text-gray-500'}`} 
          />
          {isPending && <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          </span>}
        </Button>
        {course.courseType && (
          <div className="absolute bottom-3 left-3 bg-white/90 text-gray-800 text-xs font-medium px-3 py-1.5 rounded-md backdrop-blur-sm shadow-sm border border-gray-100">
            {course.courseType}
          </div>
        )}
      </div>
      
      <CardContent className="p-5 flex-grow">
        <div className="flex flex-wrap gap-2 mb-3">
          {course.category && (
            <Badge variant="secondary" className="bg-[#f8fafc] text-[#4264f0] hover:bg-[#EEF2FF] border border-[#EEF2FF]">
              {course.category}
            </Badge>
          )}
          {course.subCategory && (
            <Badge variant="secondary" className="bg-[#f8fafc] text-gray-600 hover:bg-gray-100 border border-gray-100">
              {course.subCategory}
            </Badge>
          )}
        </div>
        
        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 leading-tight">
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
            <span>{truncateText(course.instructors, 30)}</span>
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
      
      <CardFooter className="border-t border-gray-100 px-5 py-3 bg-[#f8fafc] flex items-center justify-between">
        <div className="flex items-center">
          <StarRating rating={course.rating || 0} />
          <span className="ml-2 text-sm text-gray-700">
            {course.rating?.toFixed(1) || "N/A"}
          </span>
          {course.numberOfViewers && (
            <span className="ml-1 text-xs text-gray-500">
              ({new Intl.NumberFormat().format(course.numberOfViewers)})
            </span>
          )}
        </div>
        
        {course.site && (
          <div className="text-sm text-[#4264f0]">
            {course.site}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
