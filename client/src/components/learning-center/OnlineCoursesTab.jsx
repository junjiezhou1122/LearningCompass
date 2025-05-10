import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, throwIfResNotOk } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  BookmarkCheck,
  Bookmark,
  Plus,
  ChevronRight,
  ChevronLeft,
  Filter,
  SortAsc,
  Upload,
  FileSpreadsheet,
  Info,
  History,
  Clock,
  X,
} from "lucide-react";
import SimpleCSVUploader from "./SimpleCSVUploader";

const OnlineCoursesTab = () => {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for courses list
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subCategoryFilter, setSubCategoryFilter] = useState("all");
  const [courseTypeFilter, setCourseTypeFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Dialog states
  const [showCSVUploadDialog, setShowCSVUploadDialog] = useState(false);

  const limit = 9; // Number of courses per page

  // Fetch filter options
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/categories");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      return await response.json();
    },
  });

  const { data: subCategories = [] } = useQuery({
    queryKey: ["subcategories", categoryFilter],
    queryFn: async () => {
      const url =
        categoryFilter !== "all"
          ? `/api/subcategories?category=${encodeURIComponent(categoryFilter)}`
          : "/api/subcategories";
      const response = await apiRequest("GET", url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      return await response.json();
    },
  });

  const { data: courseTypes = [] } = useQuery({
    queryKey: ["course-types"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/course-types");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      return await response.json();
    },
  });

  const { data: languages = [] } = useQuery({
    queryKey: ["languages"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/languages");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      return await response.json();
    },
  });

  // Fetch bookmarks for the current user
  const { data: bookmarks = [] } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await apiRequest("GET", "/api/bookmarks");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      return await response.json();
    },
    enabled: isAuthenticated,
  });

  // Create a set of bookmarked course IDs for easy lookup
  const bookmarkedCourseIds = new Set(bookmarks.map((course) => course.id));

  // Fetch courses with filters
  const {
    data: coursesData = [],
    error: coursesError,
    isLoading: isLoadingCourses,
  } = useQuery({
    queryKey: [
      "courses",
      page,
      categoryFilter,
      subCategoryFilter,
      courseTypeFilter,
      languageFilter,
      searchQuery,
      sortBy,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
        sortBy: sortBy,
      });

      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (subCategoryFilter !== "all")
        params.append("subCategory", subCategoryFilter);
      if (courseTypeFilter !== "all")
        params.append("courseType", courseTypeFilter);
      if (languageFilter !== "all") params.append("language", languageFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await apiRequest(
        "GET",
        `/api/courses?${params.toString()}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      return await response.json();
    },
  });

  // Fetch total count of courses with current filters
  const { data: countData = 0 } = useQuery({
    queryKey: [
      "courses-count",
      categoryFilter,
      subCategoryFilter,
      courseTypeFilter,
      languageFilter,
      searchQuery,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (subCategoryFilter !== "all")
        params.append("subCategory", subCategoryFilter);
      if (courseTypeFilter !== "all")
        params.append("courseType", courseTypeFilter);
      if (languageFilter !== "all") params.append("language", languageFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await apiRequest(
        "GET",
        `/api/courses/count?${params.toString()}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      const data = await response.json();
      return data.count;
    },
  });

  const courses = coursesData || [];
  const totalCount = countData || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Toggle bookmark mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: async ({ courseId, isBookmarked }) => {
      if (isBookmarked) {
        const response = await apiRequest(
          "DELETE",
          `/api/bookmarks/${courseId}`
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }
        return { courseId, action: "remove" };
      } else {
        const response = await apiRequest("POST", "/api/bookmarks", {
          courseId,
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }
        return { courseId, action: "add" };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast({
        title:
          data.action === "add"
            ? "Added to Bookmarks"
            : "Removed from Bookmarks",
        description:
          data.action === "add"
            ? "Course has been added to your bookmarks"
            : "Course has been removed from your bookmarks",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Function to toggle bookmark
  const toggleBookmark = (courseId) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to bookmark courses.",
        variant: "destructive",
      });
      return;
    }

    const isBookmarked = bookmarkedCourseIds.has(courseId);
    toggleBookmarkMutation.mutate({ courseId, isBookmarked });
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    if (searchQuery.trim() && isAuthenticated) {
      fetch("/api/search-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ searchQuery: searchQuery.trim() }),
      })
        .then((response) => {
          if (!response.ok) {
            console.error("Failed to save search history:", response.status);
          } else {
            window.dispatchEvent(new CustomEvent("searchHistoryUpdated"));
          }
        })
        .catch((error) => console.error("Error saving search history:", error));
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setCategoryFilter("all");
    setSubCategoryFilter("all");
    setCourseTypeFilter("all");
    setLanguageFilter("all");
    setSearchQuery("");
    setPage(1);
  };

  // Handle CSV upload success
  const handleCsvUploadSuccess = () => {
    // Refresh course data
    queryClient.invalidateQueries({ queryKey: ["courses"] });
    queryClient.invalidateQueries({ queryKey: ["courses-count"] });
    // Show success message
    toast({
      title: "Courses Imported Successfully",
      description: "Your courses have been imported from the CSV file.",
    });
  };

  // Fetch recent searches
  const fetchRecentSearches = () => {
    if (isAuthenticated) {
      fetch("/api/search-history", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          return [];
        })
        .then((data) => {
          setRecentSearches(data.slice(0, 5));
        })
        .catch((error) => {
          console.error("Error fetching recent searches:", error);
        });
    }
  };

  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    fetchRecentSearches();
    const handleSearchHistoryUpdated = () => {
      fetchRecentSearches();
    };
    window.addEventListener("searchHistoryUpdated", handleSearchHistoryUpdated);
    return () => {
      window.removeEventListener(
        "searchHistoryUpdated",
        handleSearchHistoryUpdated
      );
    };
  }, [isAuthenticated]);

  const handleRecentSearchClick = (query) => {
    setSearchQuery(query);
    setIsSearchPopoverOpen(false);
    setPage(1);
  };

  return (
    <div>
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-orange-700">Online Courses</h2>
          <p className="text-gray-600">
            Discover courses from leading online education platforms
          </p>
        </div>

        {isAuthenticated && (
          <div className="flex gap-3">
            
            <Button
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex items-center gap-2"
              onClick={() => setShowCSVUploadDialog(true)}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Upload CSV
            </Button>
          </div>
        )}
      </div>

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl shadow-md">
        <div ref={searchContainerRef} className="relative flex-1">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                ref={searchInputRef}
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onFocus={() => {
                  if (isAuthenticated && recentSearches.length > 0) {
                    setIsSearchPopoverOpen(true);
                  }
                }}
              />
              {isAuthenticated && recentSearches.length > 0 && (
                <button
                  type="button"
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer p-1 rounded-full transition-all duration-500 ${
                    isSearchPopoverOpen
                      ? "bg-amber-100 text-amber-700"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsSearchPopoverOpen(!isSearchPopoverOpen);
                  }}
                >
                  <History
                    className={`h-4 w-4 transition-all duration-500 ${
                      isSearchPopoverOpen ? "text-amber-700" : "text-gray-400"
                    }`}
                  />
                </button>
              )}
            </div>
            <Button type="submit">Search</Button>
          </form>
          {/* Recent Searches Dropdown */}
          {isAuthenticated && recentSearches.length > 0 && (
            <div
              className={`absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-orange-100 z-50 transform transition-all duration-500 ${
                isSearchPopoverOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
              style={{ marginTop: "0.5rem", transformOrigin: "top center" }}
            >
              <div className="py-2">
                <div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 bg-orange-50/50 border-b border-orange-100">
                  <div className="flex items-center">
                    <History className="h-4 w-4 mr-2 text-orange-500" />
                    <span>Recent Searches</span>
                  </div>
                  <button
                    className="text-gray-400 hover:text-gray-600 transition-all duration-500 p-1 hover:bg-orange-100 rounded-full hover:rotate-90"
                    onClick={() => setIsSearchPopoverOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <div className="py-1">
                    {recentSearches.map((item, index) => (
                      <button
                        key={item.id}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 transition-all duration-500 hover:translate-x-1"
                        onClick={() =>
                          handleRecentSearchClick(item.searchQuery)
                        }
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animation: "slideIn 0.3s ease-out forwards",
                          opacity: 0,
                        }}
                      >
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-2 text-orange-400" />
                          <span>{item.searchQuery}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString()
                            : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateX(-10px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-out forwards;
            }
            `,
            }}
          />
        </div>

        <div className="flex gap-2 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearFilters}
                  className={
                    Object.values({
                      categoryFilter,
                      subCategoryFilter,
                      courseTypeFilter,
                      languageFilter,
                    }).some((f) => f !== "all") || searchQuery
                      ? "border-orange-400 text-orange-600"
                      : ""
                  }
                >
                  <Filter size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear all filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] border-orange-200">
              <div className="flex items-center">
                <SortAsc className="mr-2 h-4 w-4 text-orange-500" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categoryFilter !== "all" && (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 hover:bg-orange-100"
          >
            Category: {categoryFilter}
            <button
              className="ml-2 hover:text-orange-900"
              onClick={() => setCategoryFilter("all")}
            >
              ×
            </button>
          </Badge>
        )}
        {subCategoryFilter !== "all" && (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 hover:bg-orange-100"
          >
            Subcategory: {subCategoryFilter}
            <button
              className="ml-2 hover:text-orange-900"
              onClick={() => setSubCategoryFilter("all")}
            >
              ×
            </button>
          </Badge>
        )}
        {courseTypeFilter !== "all" && (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 hover:bg-orange-100"
          >
            Type: {courseTypeFilter}
            <button
              className="ml-2 hover:text-orange-900"
              onClick={() => setCourseTypeFilter("all")}
            >
              ×
            </button>
          </Badge>
        )}
        {languageFilter !== "all" && (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 hover:bg-orange-100"
          >
            Language: {languageFilter}
            <button
              className="ml-2 hover:text-orange-900"
              onClick={() => setLanguageFilter("all")}
            >
              ×
            </button>
          </Badge>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="border-orange-200">
            <div className="flex items-center">
              <SelectValue placeholder="All Categories" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories
              .filter(Boolean)
              .filter((category) => category !== "")
              .map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter}>
          <SelectTrigger className="border-orange-200">
            <div className="flex items-center">
              <SelectValue placeholder="All Subcategories" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subcategories</SelectItem>
            {subCategories
              .filter(Boolean)
              .filter((subCategory) => subCategory !== "")
              .map((subCategory) => (
                <SelectItem key={subCategory} value={subCategory}>
                  {subCategory}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select value={courseTypeFilter} onValueChange={setCourseTypeFilter}>
          <SelectTrigger className="border-orange-200">
            <div className="flex items-center">
              <SelectValue placeholder="All Course Types" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Course Types</SelectItem>
            {courseTypes
              .filter(Boolean)
              .filter((type) => type !== "")
              .map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger className="border-orange-200">
            <div className="flex items-center">
              <SelectValue placeholder="All Languages" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {languages
              .filter(Boolean)
              .filter((language) => language !== "")
              .map((language) => (
                <SelectItem key={language} value={language}>
                  {language}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Courses List */}
      {isLoadingCourses ? (
        <div className="flex justify-center items-center h-60 text-orange-500">
          <div className="animate-spin h-8 w-8 border-4 border-current border-t-transparent rounded-full"></div>
        </div>
      ) : coursesError ? (
        <div className="text-center py-12 bg-white/50 rounded-xl border border-orange-100">
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Error loading courses
          </h3>
          <p className="text-gray-500">
            There was a problem fetching the courses. Please try again.
          </p>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 bg-white/50 rounded-xl border border-orange-100">
          <div className="mx-auto w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-orange-100">
            <Search className="h-10 w-10 text-orange-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No courses found
          </h3>
          <p className="text-gray-500">
            Try adjusting your filters or search terms
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="overflow-hidden border-orange-100 hover:border-orange-300 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                onClick={() => setLocation(`/course/${course.id}`)}
              >
                <CardHeader className="bg-gradient-to-r from-orange-100/40 to-amber-100/40 pb-3">
                  <CardTitle className="text-lg font-bold text-orange-800 flex justify-between">
                    <span className="truncate">{course.title}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleBookmark(course.id);
                      }}
                      className="text-orange-500 hover:text-orange-700 transition-colors"
                      aria-label={
                        bookmarkedCourseIds.has(course.id)
                          ? "Remove bookmark"
                          : "Add bookmark"
                      }
                    >
                      {bookmarkedCourseIds.has(course.id) ? (
                        <BookmarkCheck className="h-5 w-5" />
                      ) : (
                        <Bookmark className="h-5 w-5" />
                      )}
                    </button>
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
                        <span className="text-gray-500 w-20 flex-shrink-0">
                          Rating:
                        </span>
                        <span className="text-gray-700 font-medium flex items-center">
                          {course.rating.toFixed(1)}
                          <span className="text-yellow-500 ml-1">★</span>
                        </span>
                      </div>
                    )}

                    {course.courseType && (
                      <div className="flex items-center">
                        <span className="text-gray-500 w-20 flex-shrink-0">
                          Type:
                        </span>
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
                      <Badge
                        variant="outline"
                        className="bg-white border-orange-200"
                      >
                        {course.site}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                      onClick={(e) => {
                        e.preventDefault();
                        setLocation(`/course/${course.id}`);
                      }}
                    >
                      View Details <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination className="flex justify-center">
                <PaginationContent className="flex flex-wrap items-center gap-2">
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === 1}
                      onClick={() => page > 1 && setPage(page - 1)}
                      className="h-9 w-9 rounded-md border-orange-200 text-orange-700 hover:bg-orange-50 disabled:opacity-40"
                      aria-label="Go to previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </PaginationItem>

                  {/* First page */}
                  {page > 3 && (
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage(1)}
                        className="h-9 w-9 rounded-md border-orange-200 text-orange-700 hover:bg-orange-50"
                      >
                        1
                      </Button>
                    </PaginationItem>
                  )}

                  {/* Ellipsis */}
                  {page > 4 && (
                    <PaginationItem>
                      <span className="flex h-9 px-2 items-center justify-center text-gray-400">
                        <span className="sr-only">More pages</span>
                        •••
                      </span>
                    </PaginationItem>
                  )}

                  {/* Page numbers around current page */}
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNumber = i + 1;
                    // Show current page and adjacent pages
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= page - 1 && pageNumber <= page + 1)
                    ) {
                      return (
                        <PaginationItem key={i}>
                          <Button
                            variant={
                              page === pageNumber ? "default" : "outline"
                            }
                            size="icon"
                            onClick={() => setPage(pageNumber)}
                            className={
                              page === pageNumber
                                ? "h-9 w-9 rounded-md bg-gradient-to-br from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600"
                                : "h-9 w-9 rounded-md border-orange-200 text-orange-700 hover:bg-orange-50"
                            }
                          >
                            {pageNumber}
                          </Button>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  {/* Ellipsis */}
                  {page < totalPages - 3 && (
                    <PaginationItem>
                      <span className="flex h-9 px-2 items-center justify-center text-gray-400">
                        <span className="sr-only">More pages</span>
                        •••
                      </span>
                    </PaginationItem>
                  )}

                  {/* Last page */}
                  {page < totalPages - 2 && (
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage(totalPages)}
                        className="h-9 w-9 rounded-md border-orange-200 text-orange-700 hover:bg-orange-50"
                      >
                        {totalPages}
                      </Button>
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === totalPages}
                      onClick={() => page < totalPages && setPage(page + 1)}
                      className="h-9 w-9 rounded-md border-orange-200 text-orange-700 hover:bg-orange-50 disabled:opacity-40"
                      aria-label="Go to next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <div className="mt-3 text-center text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
            </div>
          )}
        </>
      )}

      {/* CSV Upload Dialog */}
      <SimpleCSVUploader
        open={showCSVUploadDialog}
        onOpenChange={setShowCSVUploadDialog}
        onUploadSuccess={handleCsvUploadSuccess}
      />
    </div>
  );
};

export default OnlineCoursesTab;
