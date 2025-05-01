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
            <CardHeader>
              <div className="flex flex-wrap gap-2 mb-2">
                {course.category && (
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-800"
                  >
                    {course.category}
                  </Badge>
                )}
                {course.subCategory && (
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-800"
                  >
                    {course.subCategory}
                  </Badge>
                )}
                {course.courseType && (
                  <Badge className="bg-primary-600 text-white">
                    {course.courseType}
                  </Badge>
                )}
              </div>

              <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
                {course.title}
              </CardTitle>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                {course.rating && (
                  <div className="flex items-center">
                    <StarRating rating={course.rating} size="md" />
                    <span className="ml-1 font-medium">
                      {course.rating.toFixed(1)}
                    </span>
                    {course.numberOfViewers && (
                      <span className="ml-1 text-gray-500">
                        (
                        {new Intl.NumberFormat().format(course.numberOfViewers)}
                        )
                      </span>
                    )}
                  </div>
                )}

                {course.site && (
                  <div className="flex items-center">
                    <School className="h-4 w-4 mr-1 text-gray-400" />
                    <span>{course.site}</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Course Image */}
              <div className="rounded-lg overflow-hidden">
                <img
                  src={
                    course.imageUrl ||
                    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
                  }
                  alt={course.title}
                  className="w-full object-cover h-auto max-h-[400px]"
                />
              </div>

              {/* Course Introduction */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {t("aboutThisCourse")}
                </h3>
                <p className="text-gray-600">{course.shortIntro}</p>
              </div>

              {/* Course Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Instructors */}
                {course.instructors && (
                  <div className="flex items-start">
                    <User className="h-5 w-5 mr-2 text-gray-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-700">{t("instructors")}</h4>
                      <p className="text-gray-600">{course.instructors}</p>
                    </div>
                  </div>
                )}

                {/* Duration */}
                {course.duration && (
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 mr-2 text-gray-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-700">{t("duration")}</h4>
                      <p className="text-gray-600">{course.duration}</p>
                    </div>
                  </div>
                )}

                {/* Language */}
                {course.language && (
                  <div className="flex items-start">
                    <Globe className="h-5 w-5 mr-2 text-gray-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-700">{t("language")}</h4>
                      <p className="text-gray-600">{course.language}</p>
                    </div>
                  </div>
                )}

                {/* Viewers */}
                {course.numberOfViewers && (
                  <div className="flex items-start">
                    <Users className="h-5 w-5 mr-2 text-gray-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-700">{t("enrolled")}</h4>
                      <p className="text-gray-600">
                        {new Intl.NumberFormat().format(course.numberOfViewers)}{" "}
                        {t("students")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Subtitle Languages */}
              {course.subtitleLanguages && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {t("subtitlesAvailableIn")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {formatSubtitleLanguages(course.subtitleLanguages).map(
                      (language, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-gray-700"
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {t("skillsYoullGain")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {formatSkills(course.skills).map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-primary-100 text-primary-800"
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
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-xl">{t("enrollInThisCourse")}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Course Provider */}
              {course.site && (
                <div className="flex items-center justify-between text-gray-700">
                  <span>{t("courseProvider")}</span>
                  <span className="font-medium">{course.site}</span>
                </div>
              )}

              {/* Course Type */}
              {course.courseType && (
                <div className="flex items-center justify-between text-gray-700">
                  <span>{t("type")}</span>
                  <span className="font-medium">{course.courseType}</span>
                </div>
              )}

              {/* Duration */}
              {course.duration && (
                <div className="flex items-center justify-between text-gray-700">
                  <span>{t("duration")}</span>
                  <span className="font-medium">{course.duration}</span>
                </div>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="pt-2">
                <Button
                  className="w-full mb-3 bg-blue-600 hover:bg-blue-700 shadow-md"
                  size="lg"
                  onClick={() => window.open(course.url, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2 text-white" />
                  <span className="text-white font-medium">{t("goToCourse")}</span>
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant={isBookmarked ? "default" : "outline"}
                    className={`flex-1 font-medium ${
                      isBookmarked
                        ? "bg-green-600 hover:bg-green-700 shadow-md border-0"
                        : "border border-gray-300 hover:bg-gray-50 text-gray-700"
                    }`}
                    onClick={handleBookmarkToggle}
                    disabled={isBookmarking}
                  >
                    {isBookmarking ? (
                      <span className="mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Bookmark
                        className={`h-4 w-4 mr-2 ${
                          isBookmarked
                            ? "fill-white text-white"
                            : "text-gray-600"
                        }`}
                      />
                    )}
                    <span
                      className={
                        isBookmarked
                          ? "text-white font-medium"
                          : "text-gray-700"
                      }
                    >
                      {isBookmarked ? t("bookmarked") : t("bookmark")}
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="font-medium border border-gray-300 hover:bg-gray-50"
                  >
                    <Share2 className="h-4 w-4 mr-2 text-gray-600" />
                    <span className="text-gray-700">{t("share")}</span>
                  </Button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="text-sm text-gray-500 flex items-center justify-center">
              <BookOpen className="h-4 w-4 mr-1" />
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
      <div className="mt-8">
        <CommentSection courseId={id} />
      </div>
    </div>
  );
}
