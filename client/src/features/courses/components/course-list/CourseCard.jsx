import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { extractSkills } from "@/lib/utils";

// Import components
import CourseCardImage from "./CourseCardImage";
import CourseCardContent from "./CourseCardContent";
import CourseCardFooter from "./CourseCardFooter";

export default function CourseCard({ course, bookmarked = false, onBookmarkChange }) {
  const [isBookmarked, setIsBookmarked] = useState(bookmarked);
  const [isPending, setIsPending] = useState(false);
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

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
        title: t("authRequired"),
        description: t("signInToBookmark"),
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
          title: t("authRequired"),
          description: t("loginAgainToBookmark"),
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
            title: t("bookmarkRemoved"),
            description: t("bookmarkRemovedDescription").replace('{title}', course.title),
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
            title: t("bookmarkAdded"),
            description: t("bookmarkAddedDescription").replace('{title}', course.title),
          });
          
          // Call the callback if provided
          if (onBookmarkChange) {
            onBookmarkChange(course.id, true);
          }
        } else if (response.status === 409) {
          // Bookmark already exists
          setIsBookmarked(true);
          toast({
            title: t("alreadyBookmarked"),
            description: t("alreadyBookmarkedDescription").replace('{title}', course.title),
          });
        } else {
          throw new Error("Failed to add bookmark");
        }
      }
    } catch (error) {
      console.error("Bookmark error:", error);
      toast({
        title: t("error"),
        description: t("bookmarkUpdateError"),
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

  return (
    <Card 
      className={`course-card overflow-hidden h-full flex flex-col transition-all duration-300 
        hover:shadow-lg hover:-translate-y-2 hover:scale-[1.02] rounded-xl 
        ${isBookmarked ? 'border-orange-300 shadow-sm' : 'border-gray-100'}
        transform perspective-1000 backface-hidden`}
      onClick={handleCardClick}
    >
      <CourseCardImage 
        imageUrl={course.imageUrl}
        title={course.title}
        courseType={course.courseType}
        isBookmarked={isBookmarked}
        isPending={isPending}
        onBookmarkToggle={handleBookmarkToggle}
        t={t}
      />
      
      <CourseCardContent course={course} />
      
      <CourseCardFooter course={course} />
    </Card>
  );
}
