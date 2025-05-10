import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, AlertCircle, BookOpen, Globe } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  BookmarkCheck,
  BookmarkPlus,
  ExternalLink,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Helper: University course card (inline, for now)
function UniversityCourseCard({ course, bookmarked, onBookmarkChange }) {
  return (
    <Card className="overflow-hidden border-orange-100 hover:border-orange-300 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
      <CardHeader className="bg-gradient-to-r from-orange-100/40 to-amber-100/40 pb-3">
        <CardTitle className="text-lg font-bold text-orange-800 flex justify-between">
          <span className="truncate">
            {course.courseNumber}: {course.courseTitle}
          </span>
        </CardTitle>
        <div className="flex items-center gap-2 mb-1">
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200"
          >
            {course.university}
          </Badge>
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
          >
            {course.courseDept}
          </Badge>
        </div>
        <CardDescription className="text-gray-600 line-clamp-2">
          {course.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Professors:</span>
            <span className="text-gray-700 font-medium">
              {course.professors}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Recent Semesters:</span>
            <span className="text-gray-700 font-medium">
              {course.recentSemesters}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        <Button
          variant="outline"
          className="text-orange-700 hover:text-orange-800 hover:bg-orange-50 flex items-center gap-1 border-orange-200"
          onClick={() =>
            window.open(`/learning-center/courses/${course.id}`, "_blank")
          }
        >
          Course Details <ChevronRight className="h-4 w-4" />
        </Button>
        {course.url && (
          <Button
            variant="ghost"
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 flex items-center gap-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(course.url, "_blank", "noopener,noreferrer");
            }}
          >
            University Site <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Helper: Online course card (inline, for now)
function OnlineCourseCard({ course, bookmarked, onBookmarkChange }) {
  return (
    <Card className="overflow-hidden border-orange-100 hover:border-orange-300 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
      <CardHeader className="bg-gradient-to-r from-orange-100/40 to-amber-100/40 pb-3">
        <CardTitle className="text-lg font-bold text-orange-800 flex justify-between">
          <span className="truncate">{course.title}</span>
        </CardTitle>
        <CardDescription>
          <div className="flex flex-wrap gap-2 mt-1">
            {course.category && (
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-800 hover:bg-orange-200"
              >
                {course.category}
              </Badge>
            )}
            {course.language && (
              <Badge
                variant="outline"
                className="text-gray-600 border-gray-300"
              >
                {course.language}
              </Badge>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="text-sm text-gray-600 mb-4 line-clamp-3">
          {course.shortIntro || "No description available."}
        </div>
        <div className="text-sm space-y-1">
          {course.instructors && (
            <div className="flex items-start">
              <span className="text-gray-500 w-20 flex-shrink-0">
                Instructor:
              </span>
              <span className="text-gray-700 font-medium truncate">
                {course.instructors}
              </span>
            </div>
          )}
          {course.rating !== null && course.rating !== undefined && (
            <div className="flex items-center">
              <span className="text-gray-500 w-20 flex-shrink-0">Rating:</span>
              <span className="text-gray-700 font-medium flex items-center">
                {course.rating.toFixed(1)}
                <span className="text-yellow-500 ml-1">★</span>
              </span>
            </div>
          )}
          {course.courseType && (
            <div className="flex items-center">
              <span className="text-gray-500 w-20 flex-shrink-0">Type:</span>
              <span className="text-gray-700 font-medium">
                {course.courseType}
              </span>
            </div>
          )}
          {course.duration && (
            <div className="flex items-center">
              <span className="text-gray-500 w-20 flex-shrink-0">
                Duration:
              </span>
              <span className="text-gray-700 font-medium">
                {course.duration}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t border-orange-100 bg-gradient-to-r from-orange-50/30 to-amber-50/30">
        <div className="w-full flex justify-between items-center">
          {course.site && (
            <Badge variant="outline" className="bg-white border-orange-200">
              {course.site}
            </Badge>
          )}
          <Button
            variant="ghost"
            className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
            onClick={(e) => {
              e.preventDefault();
              window.open(`/course/${course.id}`, "_blank");
            }}
          >
            View Details <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function LearningCenterBookmarksTab() {
  const { isAuthenticated, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [type, setType] = useState("online"); // "online" or "university"
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const itemsPerPage = 9;

  // Reset to page 1 when type or sort changes
  React.useEffect(() => {
    setPage(1);
  }, [type, sortBy]);

  // Fetch online course bookmarks
  const {
    data: onlineBookmarks = [],
    isLoading: loadingOnline,
    error: errorOnline,
  } = useQuery({
    queryKey: ["/api/bookmarks"],
    queryFn: async ({ queryKey }) => {
      if (!isAuthenticated) return [];
      const response = await fetch(queryKey[0], {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error("Failed to fetch bookmarks");
      }
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Fetch university course bookmarks
  const {
    data: universityBookmarks = [],
    isLoading: loadingUniversity,
    error: errorUniversity,
  } = useQuery({
    queryKey: ["/api/university-course-bookmarks"],
    queryFn: async ({ queryKey }) => {
      if (!isAuthenticated) return [];
      const response = await fetch(queryKey[0], {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error("Failed to fetch university course bookmarks");
      }
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Sorting logic (reuse from Bookmarks.jsx)
  const sortCourses = (courses) => {
    return [...courses].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return (a.title || a.courseTitle || "").localeCompare(
            b.title || b.courseTitle || ""
          );
        case "highest_rated":
          return (b.rating || 0) - (a.rating || 0);
        case "most_popular":
          return (b.numberOfViewers || 0) - (a.numberOfViewers || 0);
        case "newest":
        default:
          return (b.id || 0) - (a.id || 0);
      }
    });
  };

  // Loading state
  if (loadingOnline || loadingUniversity) {
    return (
      <div className="py-12 text-center">
        <Skeleton className="h-8 w-40 mx-auto mb-4" />
        <Skeleton className="h-10 w-60 mx-auto mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
        </div>
      </div>
    );
  }

  // Error state
  if (errorOnline || errorUniversity) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Error Loading Bookmarks
        </h2>
        <p className="text-gray-600 mb-6">
          We encountered an error while loading your bookmarks. Please try again
          later.
        </p>
      </div>
    );
  }

  // Empty state
  const currentList = type === "online" ? onlineBookmarks : universityBookmarks;
  const sortedList = sortCourses(currentList);
  const totalPages = Math.ceil(sortedList.length / itemsPerPage);
  const paginatedList = sortedList.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if (currentList.length === 0) {
    return (
      <div className="py-12 text-center">
        <Bookmark className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          No Bookmarks Yet
        </h2>
        <p className="text-gray-600 mb-6">
          Start bookmarking courses you're interested in, and they'll appear
          here for easy access.
        </p>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Bookmark Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">
                <Globe className="inline h-4 w-4 mr-2 text-orange-500" /> Online
                Courses
              </SelectItem>
              <SelectItem value="university">
                <BookOpen className="inline h-4 w-4 mr-2 text-orange-500" />{" "}
                University Courses
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-2">Sort by:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
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
        {paginatedList.map((course) =>
          type === "online" ? (
            <OnlineCourseCard
              key={course.id}
              course={course}
              bookmarked={true}
            />
          ) : (
            <UniversityCourseCard
              key={course.id}
              course={course}
              bookmarked={true}
            />
          )
        )}
      </div>
      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
                }}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {/* First page */}
            {page > 2 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(1);
                  }}
                >
                  1
                </PaginationLink>
              </PaginationItem>
            )}
            {/* Ellipsis if needed */}
            {page > 3 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {/* Previous page */}
            {page > 1 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(page - 1);
                  }}
                >
                  {page - 1}
                </PaginationLink>
              </PaginationItem>
            )}
            {/* Current page */}
            <PaginationItem>
              <PaginationLink
                href="#"
                isActive
                onClick={(e) => e.preventDefault()}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
            {/* Next page */}
            {page < totalPages && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(page + 1);
                  }}
                >
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
            )}
            {/* Ellipsis if needed */}
            {page < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {/* Last page */}
            {page < totalPages - 1 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(totalPages);
                  }}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) setPage(page + 1);
                }}
                className={
                  page === totalPages ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
