import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Clock,
  Globe,
  ArrowLeft,
  BookOpen, 
  Users
} from "lucide-react";
import CommentSection from "@/components/CommentSection";

// Importing the componentized parts
import CourseHeader from "../components/course-detail/CourseHeader";
import CourseImage from "../components/course-detail/CourseImage";
import CourseIntroduction from "../components/course-detail/CourseIntroduction";
import CourseInfoItem from "../components/course-detail/CourseInfoItem";
import CourseSkills from "../components/course-detail/CourseSkills";
import CourseSidebar from "../components/course-detail/CourseSidebar";

export default function CourseDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { isAuthenticated, token } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  // Fetch course details
  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/courses/${id}`],
    queryFn: async ({ queryKey }) => {
      try {
        const response = await fetch(queryKey[0]);
        if (!response.ok) {
          throw new Error("Failed to fetch course details");
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching course:", error);
        throw error;
      }
    },
  });

  // Fetch bookmark status if authenticated
  const { data: bookmarks = [] } = useQuery({
    queryKey: ["/api/bookmarks"],
    queryFn: async ({ queryKey }) => {
      if (!isAuthenticated) return [];

      const response = await fetch(queryKey[0], {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error("Failed to fetch bookmarks");
      }

      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Check if course is bookmarked
  useEffect(() => {
    if (bookmarks.length > 0 && course) {
      const bookmarked = bookmarks.some(
        (bookmark) => bookmark.id === course.id
      );
      setIsBookmarked(bookmarked);
    }
  }, [bookmarks, course]);

  // Handle bookmark toggle
  const handleBookmarkToggle = async () => {
    if (!isAuthenticated) {
      toast({
        title: t("authRequired"),
        description: t("pleaseSignInToBookmark"),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsBookmarking(true);

      // Get the authentication token
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        toast({
          title: t("authRequired"),
          description: t("pleaseLoginAgain"),
          variant: "destructive",
        });
        return;
      }

      console.log("Attempting to toggle bookmark for course:", course.id);

      if (isBookmarked) {
        // Remove bookmark
        const response = await apiRequest(
          "DELETE",
          `/api/bookmarks/${course.id}`,
          undefined,
          storedToken
        );

        // Check for server connectivity issues first (our fake 503 response)
        if (response.status === 503) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Server is currently unavailable"
          );
        }

        // Check for network errors (our fake 500 response)
        if (response.status === 500) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Network error occurred");
        }

        // Handle success cases
        if (response.status === 204 || response.status === 200) {
          setIsBookmarked(false);
          toast({
            title: t("bookmarkRemoved"),
            description: t("courseRemovedFromBookmarks", { title: course.title }),
          });

          // Invalidate bookmarks query to refresh the list
          queryClient.invalidateQueries(["/api/bookmarks"]);
        } else if (response.status === 404) {
          // Bookmark not found
          setIsBookmarked(false);
          toast({
            title: t("alreadyRemoved"),
            description: t("courseAlreadyRemoved"),
          });

          // Invalidate bookmarks query to refresh the list
          queryClient.invalidateQueries(["/api/bookmarks"]);
        } else {
          // Handle other error cases
          let errorMessage = "Failed to remove bookmark";
          try {
            const errorData = await response.json();
            errorMessage =
              errorData.message ||
              `Error: ${response.status} ${response.statusText}`;
          } catch (e) {
            // If we can't parse JSON
            try {
              const errorText = await response.text();
              errorMessage = errorText || errorMessage;
            } catch (textError) {
              console.error("Could not read error response:", textError);
            }
          }
          throw new Error(errorMessage);
        }
      } else {
        // Add bookmark
        const response = await apiRequest(
          "POST",
          "/api/bookmarks",
          {
            courseId: course.id,
          },
          storedToken
        );

        // Check for server connectivity issues (our fake 503 response)
        if (response.status === 503) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Server is currently unavailable"
          );
        }

        // Check for network errors (our fake 500 response)
        if (response.status === 500) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Network error occurred");
        }

        // Handle success cases
        if (response.status === 201 || response.status === 200) {
          setIsBookmarked(true);
          toast({
            title: t("bookmarkAdded"),
            description: t("courseAddedToBookmarks", { title: course.title }),
          });

          // Invalidate bookmarks query to refresh the list
          queryClient.invalidateQueries(["/api/bookmarks"]);
        } else if (response.status === 409) {
          // Bookmark already exists
          setIsBookmarked(true);
          toast({
            title: t("alreadyBookmarked"),
            description: t("courseAlreadyInBookmarks", { title: course.title }),
          });

          // Invalidate bookmarks query to refresh the list
          queryClient.invalidateQueries(["/api/bookmarks"]);
        } else {
          // Handle other error cases
          let errorMessage = "Failed to add bookmark";
          try {
            const errorData = await response.json();
            errorMessage =
              errorData.message ||
              `Error: ${response.status} ${response.statusText}`;
          } catch (e) {
            // If we can't parse JSON
            try {
              const errorText = await response.text();
              errorMessage = errorText || errorMessage;
            } catch (textError) {
              console.error("Could not read error response:", textError);
            }
          }
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Bookmark operation error:", error);
      toast({
        title: t("operationFailed"),
        description:
          error.message ||
          t("bookmarkUpdateFailed"),
        variant: "destructive",
      });
    } finally {
      setIsBookmarking(false);
    }
  };

  // Handle share button click
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: course.title,
          text: course.shortIntro,
          url: window.location.href,
        })
        .then(() => console.log("Shared successfully"))
        .catch((error) => console.log("Error sharing:", error));
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: t("linkCopied"),
        description: t("courseLinkCopied"),
      });
    }
  };

  // Handle back button click
  const handleBackClick = () => {
    navigate("/courses");
  };

  // Format skills for display
  const formatSkills = (skills) => {
    if (!skills) return [];
    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);
  };

  // Format subtitle languages for display
  const formatSubtitleLanguages = (subtitles) => {
    if (!subtitles) return [];
    // Remove "Subtitles:" prefix if present
    const cleanedSubtitles = subtitles.replace(/^Subtitles:\s*/i, "");
    return cleanedSubtitles
      .split(",")
      .map((lang) => lang.trim())
      .filter((lang) => lang.length > 0);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={handleBackClick}
            className="text-gray-600 hover:text-primary-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToCourses")}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="p-6 pb-0">
                  <Skeleton className="h-8 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="p-6">
                  <Skeleton className="h-[225px] w-full mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-6" />
                <Skeleton className="h-4 w-full mb-3" />
                <Skeleton className="h-4 w-full mb-3" />
                <Skeleton className="h-4 w-full mb-3" />
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t("courseNotFound")}
          </h2>
          <p className="text-gray-600 mb-6">
            {t("courseNotFoundMessage")}
          </p>
          <Button onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToCourses")}
          </Button>
        </div>
      </div>
    );
  }

  // Process skills and subtitle languages
  const formattedSkills = formatSkills(course.skills);
  const subtitleLanguages = formatSubtitleLanguages(course.subtitles);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={handleBackClick}
          className="text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("backToCourses")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Details */}
        <div className="lg:col-span-2">
          <Card>
            <CourseHeader course={course} />

            <CardContent className="space-y-6">
              {/* Course Image */}
              <CourseImage imageUrl={course.imageUrl} title={course.title} />

              {/* Course Introduction */}
              <CourseIntroduction 
                title={t("aboutThisCourse")} 
                intro={course.shortIntro} 
              />

              {/* Course Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Instructors */}
                {course.instructors && (
                  <CourseInfoItem 
                    icon={<User className="h-5 w-5 text-gray-400" />}
                    title={t("instructors")}
                    content={course.instructors}
                  />
                )}

                {/* Duration */}
                {course.duration && (
                  <CourseInfoItem 
                    icon={<Clock className="h-5 w-5 text-gray-400" />}
                    title={t("duration")}
                    content={course.duration}
                  />
                )}

                {/* Language */}
                {course.language && (
                  <CourseInfoItem 
                    icon={<Globe className="h-5 w-5 text-gray-400" />}
                    title={t("language")}
                    content={course.language}
                  />
                )}

                {/* Subtitle Languages */}
                {subtitleLanguages.length > 0 && (
                  <CourseInfoItem 
                    icon={<Globe className="h-5 w-5 text-gray-400" />}
                    title={t("subtitles")}
                    content={subtitleLanguages.join(", ")}
                  />
                )}

                {/* Students */}
                {course.numberOfViewers && (
                  <CourseInfoItem 
                    icon={<Users className="h-5 w-5 text-gray-400" />}
                    title={t("students")}
                    content={new Intl.NumberFormat().format(course.numberOfViewers)}
                  />
                )}

                {/* Skill Level */}
                {course.skillLevel && (
                  <CourseInfoItem 
                    icon={<BookOpen className="h-5 w-5 text-gray-400" />}
                    title={t("skillLevel")}
                    content={course.skillLevel}
                  />
                )}
              </div>

              {/* Skills */}
              {formattedSkills.length > 0 && (
                <CourseSkills skills={formattedSkills} />
              )}

              {/* Comments (if applicable) */}
              <CommentSection courseId={course.id} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <CourseSidebar 
            course={course}
            isBookmarked={isBookmarked}
            isBookmarking={isBookmarking}
            onBookmarkToggle={handleBookmarkToggle}
            onShare={handleShare}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
