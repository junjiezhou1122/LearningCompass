import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink,
  Bookmark,
  Share2,
  User,
  Clock,
  Globe,
  School,
  ArrowLeft,
  BookOpen,
  Users,
} from "lucide-react";
import StarRating from "@/components/StarRating";
import CommentSection from "@/components/CommentSection";

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
            description: t("courseRemovedFromBookmarks", {
              title: course.title,
            }),
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
        description: error.message || t("bookmarkUpdateFailed"),
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
    navigate("/learning-center?tab=online-courses");
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
            {t("backToOnlineCourses")}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[225px] w-full mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
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
          <p className="text-gray-600 mb-6">{t("courseNotFoundMessage")}</p>
          <Button onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToOnlineCourses")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-12">
      {/* Animated orange/amber blobs for background depth */}
      <div className="absolute -z-10 top-0 right-0 w-96 h-96 bg-amber-200 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-1000"></div>
      <div className="absolute -z-10 bottom-0 left-0 w-96 h-96 bg-orange-200 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-3000"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-white opacity-80"></div>

      <div className="container mx-auto px-4 py-6 relative z-10">
        <nav className="mb-2 text-sm text-orange-700 flex items-center gap-2">
          <a
            href="/learning-center?tab=online-courses"
            className="hover:underline font-medium"
          >
            Learning Center
          </a>
          <span className="mx-1">&gt;</span>
          <a
            href="/learning-center?tab=online-courses"
            className="hover:underline font-medium"
          >
            Online Courses
          </a>
          <span className="mx-1">&gt;</span>
          <span className="font-semibold text-orange-900">
            {course?.title || t("courseDetail")}
          </span>
        </nav>
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/learning-center?tab=online-courses")}
            className="text-orange-700 hover:text-white hover:bg-orange-600 transition-all duration-300 font-medium rounded-md"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToOnlineCourses")}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          {/* Course Details */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-orange-100 shadow-md bg-gradient-to-br from-white via-white to-amber-50">
              <CardHeader>
                <div className="flex flex-wrap gap-2 mb-2">
                  {course.category && (
                    <Badge
                      variant="outline"
                      className="bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100 transition-colors duration-300"
                    >
                      {course.category}
                    </Badge>
                  )}
                  {course.subCategory && (
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-700 border-amber-100 hover:bg-amber-200 transition-colors duration-300"
                    >
                      {course.subCategory}
                    </Badge>
                  )}
                  {course.courseType && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-sm">
                      {course.courseType}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent animate-fadeIn">
                  {course.title}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                  {course.rating && (
                    <div className="flex items-center">
                      <StarRating rating={course.rating} size="md" />
                      <span className="ml-1 font-medium text-orange-700">
                        {course.rating.toFixed(1)}
                      </span>
                      {course.numberOfViewers && (
                        <span className="ml-1 text-amber-700">
                          (
                          {new Intl.NumberFormat().format(
                            course.numberOfViewers
                          )}
                          )
                        </span>
                      )}
                    </div>
                  )}
                  {course.site && (
                    <div className="flex items-center">
                      <School className="h-4 w-4 mr-1 text-orange-400" />
                      <span className="text-orange-700">{course.site}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Course Image */}
                <div className="rounded-xl overflow-hidden shadow-md border border-orange-100">
                  <img
                    src={
                      course.imageUrl ||
                      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
                    }
                    alt={course.title}
                    className="w-full object-cover h-auto max-h-[400px] transition-transform duration-500 hover:scale-105"
                  />
                </div>
                {/* Course Introduction */}
                <div>
                  <h3 className="text-xl font-semibold text-orange-700 mb-3 animate-fadeIn">
                    {t("aboutThisCourse")}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {course.shortIntro}
                  </p>
                </div>
                {/* Course Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Instructors */}
                  {course.instructors && (
                    <div className="flex items-start">
                      <User className="h-5 w-5 mr-2 text-orange-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-700">
                          {t("instructors")}
                        </h4>
                        <p className="text-gray-700">{course.instructors}</p>
                      </div>
                    </div>
                  )}
                  {/* Duration */}
                  {course.duration && (
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 mr-2 text-orange-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-700">
                          {t("duration")}
                        </h4>
                        <p className="text-gray-700">{course.duration}</p>
                      </div>
                    </div>
                  )}
                  {/* Language */}
                  {course.language && (
                    <div className="flex items-start">
                      <Globe className="h-5 w-5 mr-2 text-orange-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-700">
                          {t("language")}
                        </h4>
                        <p className="text-gray-700">{course.language}</p>
                      </div>
                    </div>
                  )}
                  {/* Viewers */}
                  {course.numberOfViewers && (
                    <div className="flex items-start">
                      <Users className="h-5 w-5 mr-2 text-orange-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-700">
                          {t("enrolled")}
                        </h4>
                        <p className="text-gray-700">
                          {new Intl.NumberFormat().format(
                            course.numberOfViewers
                          )}{" "}
                          {t("students")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {/* Subtitle Languages */}
                {course.subtitleLanguages && (
                  <div>
                    <h3 className="text-lg font-semibold text-orange-700 mb-2">
                      {t("subtitlesAvailableIn")}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {formatSubtitleLanguages(course.subtitleLanguages).map(
                        (language, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100 transition-colors duration-300"
                          >
                            {language}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}
                {/* Skills */}
                {course.skills && (
                  <div>
                    <h3 className="text-lg font-semibold text-orange-700 mb-2">
                      {t("skillsYoullGain")}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {formatSkills(course.skills).map((skill, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-amber-100 text-amber-700 border-amber-100 hover:bg-amber-200 transition-colors duration-300"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Action Sidebar */}
          <div>
            <Card className="sticky top-24 border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50/50 shadow-lg animate-float">
              <CardHeader>
                <CardTitle className="text-xl text-orange-700 font-bold animate-fadeIn">
                  {t("enrollInThisCourse")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Course Provider */}
                {course.site && (
                  <div className="flex items-center justify-between text-orange-700">
                    <span>{t("courseProvider")}</span>
                    <span className="font-medium">{course.site}</span>
                  </div>
                )}
                {/* Course Type */}
                {course.courseType && (
                  <div className="flex items-center justify-between text-orange-700">
                    <span>{t("type")}</span>
                    <span className="font-medium">{course.courseType}</span>
                  </div>
                )}
                {/* Duration */}
                {course.duration && (
                  <div className="flex items-center justify-between text-orange-700">
                    <span>{t("duration")}</span>
                    <span className="font-medium">{course.duration}</span>
                  </div>
                )}
                <Separator className="bg-gradient-to-r from-orange-200 to-amber-200 h-1 my-2" />
                {/* Action Buttons */}
                <div className="pt-2">
                  <Button
                    className="w-full mb-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md text-white font-semibold text-lg transition-all duration-300"
                    size="lg"
                    onClick={() => window.open(course.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2 text-white" />
                    <span>{t("goToCourse")}</span>
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant={isBookmarked ? "default" : "outline"}
                      className={`flex-1 font-medium border-orange-200 transition-all duration-300 ${
                        isBookmarked
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 border-0"
                          : "text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                      }`}
                      onClick={handleBookmarkToggle}
                      disabled={isBookmarking}
                    >
                      {isBookmarking ? (
                        <span className="mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Bookmark
                          className={`h-4 w-4 mr-2 ${
                            isBookmarked ? "text-white" : "text-orange-700"
                          }`}
                        />
                      )}
                      <span>
                        {isBookmarked ? t("bookmarked") : t("bookmark")}
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleShare}
                      className="font-medium border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800 transition-all duration-300"
                    >
                      <Share2 className="h-4 w-4 mr-2 text-orange-700" />
                      <span>{t("share")}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-orange-600 flex items-center justify-center bg-gradient-to-r from-orange-50 to-amber-50 border-t border-orange-100">
                <BookOpen className="h-4 w-4 mr-1 text-orange-400" />
                {course.numberOfViewers
                  ? `${new Intl.NumberFormat().format(
                      course.numberOfViewers
                    )} ${t("studentsEnrolled")}`
                  : t("beFirstToEnroll")}
              </CardFooter>
            </Card>
          </div>
        </div>
        {/* Comments Section */}
        <div className="mt-10 animate-fadeIn">
          <Card className="border-orange-100 bg-gradient-to-br from-white via-orange-50 to-amber-50 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-orange-700 font-bold">
                {t("comments")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CommentSection courseId={id} />
            </CardContent>
          </Card>
        </div>
        {/* Related Courses Section */}
        <div className="mt-10 animate-fadeIn">
          <Card className="border-orange-100 bg-gradient-to-br from-white via-orange-50 to-amber-50 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-orange-700 font-bold">
                Related Online Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Placeholder cards for related courses */}
                <div className="rounded-lg border border-orange-100 bg-white p-4 text-center text-gray-500">
                  Related Course 1
                </div>
                <div className="rounded-lg border border-orange-100 bg-white p-4 text-center text-gray-500">
                  Related Course 2
                </div>
                <div className="rounded-lg border border-orange-100 bg-white p-4 text-center text-gray-500">
                  Related Course 3
                </div>
                <div className="rounded-lg border border-orange-100 bg-white p-4 text-center text-gray-500">
                  Related Course 4
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
