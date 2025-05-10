import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  BookOpen,
  School,
  ChevronRight,
  Search,
  BookmarkPlus,
  BookmarkCheck,
  Filter,
  Plus,
  ExternalLink,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient, apiRequest, throwIfResNotOk } from "@/lib/queryClient";
import SimpleCSVUploader from "./SimpleCSVUploader";

const UniversityCoursesTab = () => {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [universityFilter, setUniversityFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddCourseDialog, setShowAddCourseDialog] = useState(false);
  const [showCsvUploadDialog, setShowCsvUploadDialog] = useState(false);
  const limit = 9; // Number of courses per page

  // Fetch universities for filter dropdown
  const { data: universities = [] } = useQuery({
    queryKey: ["universities"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/universities");
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching universities:", error);
        throw error;
      }
    },
  });

  // Fetch departments for filter dropdown
  const { data: departments = [] } = useQuery({
    queryKey: ["course-departments", universityFilter],
    queryFn: async () => {
      try {
        const url = universityFilter
          ? `/api/course-departments?university=${encodeURIComponent(
              universityFilter
            )}`
          : "/api/course-departments";
        const response = await apiRequest("GET", url);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching departments:", error);
        throw error;
      }
    },
    enabled: true, // Always fetch departments
  });

  // Fetch total count of university courses with the same filters for pagination
  const { data: countData, isLoading: isLoadingCount } = useQuery({
    queryKey: [
      "university-courses-count",
      universityFilter,
      deptFilter,
      searchQuery,
    ],
    queryFn: async () => {
      let url = `/api/university-courses/count`;

      const params = new URLSearchParams();

      if (universityFilter && universityFilter !== "all") {
        params.append("university", universityFilter);
      }

      if (deptFilter && deptFilter !== "all") {
        params.append("courseDept", deptFilter);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      try {
        const response = await apiRequest("GET", url);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }
        const data = await response.json();
        return data.count;
      } catch (error) {
        console.error("Error fetching course count:", error);
        throw error;
      }
    },
  });

  // Fetch university courses with filters and pagination
  const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
    queryKey: [
      "university-courses",
      universityFilter,
      deptFilter,
      searchQuery,
      page,
      limit,
    ],
    queryFn: async () => {
      let url = `/api/university-courses?limit=${limit}&offset=${
        (page - 1) * limit
      }`;

      if (universityFilter && universityFilter !== "all") {
        url += `&university=${encodeURIComponent(universityFilter)}`;
      }

      if (deptFilter && deptFilter !== "all") {
        url += `&courseDept=${encodeURIComponent(deptFilter)}`;
      }

      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      try {
        // Use the apiRequest which properly handles errors and response parsing
        const response = await apiRequest("GET", url);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }
        const courses = await response.json();
        return courses;
      } catch (error) {
        console.error("Error fetching courses:", error);
        throw error;
      }
    },
  });

  // Fetch user's bookmarked courses
  const { data: bookmarks = [], isLoading: isLoadingBookmarks } = useQuery({
    queryKey: ["university-course-bookmarks"],
    queryFn: async () => {
      if (!isAuthenticated) return [];

      try {
        const response = await apiRequest(
          "GET",
          "/api/university-course-bookmarks"
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }
        return await response.json();
      } catch (error) {
        if (error.message.includes("401")) return []; // Not authenticated
        throw error;
      }
    },
    enabled: isAuthenticated, // Only fetch if authenticated
  });

  // Create a set of bookmarked course IDs for quick lookup
  const bookmarkedCourseIds = new Set(bookmarks.map((course) => course.id));

  const courses = coursesData || [];
  const totalCount = countData || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Form schema for adding a new university course
  const formSchema = z.object({
    university: z.string().min(1, "University is required"),
    courseDept: z.string().min(1, "Department is required"),
    courseNumber: z.string().min(1, "Course number is required"),
    courseTitle: z.string().min(1, "Course title is required"),
    description: z.string().optional(),
    professors: z.string().optional(),
    recentSemesters: z.string().optional(),
    url: z
      .string()
      .url("Please enter a valid URL")
      .optional()
      .or(z.literal("")),
  });

  // Form for adding a new university course
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      university: "",
      courseDept: "",
      courseNumber: "",
      courseTitle: "",
      description: "",
      professors: "",
      recentSemesters: "",
      url: "",
    },
  });

  // Mutation for adding a new university course
  const addCourseMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest(
        "POST",
        "/api/university-courses",
        data
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      const responseData = await response.json();
      return responseData;
    },
    onSuccess: () => {
      // Reset form and close dialog
      form.reset();
      setShowAddCourseDialog(false);

      // Show success toast
      toast({
        title: "Success!",
        description: "The university course has been added successfully.",
        variant: "default",
      });

      // Invalidate queries to refresh the list and count
      queryClient.invalidateQueries({ queryKey: ["university-courses"] });
      queryClient.invalidateQueries({ queryKey: ["university-courses-count"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to add university course. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Function to handle form submission
  const onSubmit = (data) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add university courses.",
        variant: "destructive",
      });
      return;
    }

    addCourseMutation.mutate(data);
  };

  // Function to toggle bookmark
  const toggleBookmark = async (courseId) => {
    if (!isAuthenticated) {
      // Could redirect to login or show a toast
      toast({
        title: "Authentication Required",
        description: "Please log in to bookmark courses.",
        variant: "destructive",
      });
      return;
    }

    const isBookmarked = bookmarkedCourseIds.has(courseId);

    try {
      if (isBookmarked) {
        // Remove bookmark
        const response = await apiRequest(
          "DELETE",
          `/api/university-course-bookmarks/${courseId}`
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }
      } else {
        // Add bookmark
        const response = await apiRequest(
          "POST",
          "/api/university-course-bookmarks",
          { universityCourseId: courseId }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }
      }

      // Invalidate bookmarks query to refetch
      queryClient.invalidateQueries({
        queryKey: ["university-course-bookmarks"],
      });
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle CSV upload success
  const handleCsvUploadSuccess = (data) => {
    console.log("University courses CSV import successful:", data);

    // Show success message with more details
    const importCount = data?.importedCount || 0;
    const totalCount = data?.totalRecords || 0;
    const warningsCount = data?.warnings?.length || 0;
    const failedCount = data?.failedRecords?.length || 0;

    toast({
      title: "University Courses Imported Successfully",
      description: `${importCount} out of ${totalCount} university courses have been imported${
        warningsCount > 0 ? ` (with ${warningsCount} warnings)` : ""
      }${
        failedCount > 0 ? ` (${failedCount} failed)` : ""
      }. The course list is being refreshed.`,
      variant: "default",
      duration: 5000, // Show for 5 seconds
    });

    // Reset page to 1 to show new courses
    setPage(1);

    // Force refresh data
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["university-courses"] });
      queryClient.invalidateQueries({ queryKey: ["university-courses-count"] });
      queryClient.invalidateQueries({ queryKey: ["universities"] });
      queryClient.invalidateQueries({ queryKey: ["course-departments"] });
    }, 500);
  };

  return (
    <div>
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-orange-700">
            University Courses
          </h2>
          <p className="text-gray-600">
            Discover courses from leading universities like MIT and Stanford
          </p>
        </div>

        {isAuthenticated && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
              onClick={() => setShowCsvUploadDialog(true)}
            >
              <FileSpreadsheet className="h-4 w-4 text-orange-500" />
              Import CSV
            </Button>
            <Button
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex items-center gap-2"
              onClick={() => setShowAddCourseDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Add Course
            </Button>
          </div>
        )}
      </div>

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl shadow-md">
        <div className="flex-1">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1); // Reset to first page on search change
              }}
              className="pl-10 bg-white/70 border-orange-200 focus:border-orange-400"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <Select
            value={universityFilter}
            onValueChange={(value) => {
              setUniversityFilter(value);
              setDeptFilter("all"); // Reset department filter when university changes
              setPage(1); // Reset to first page on filter change
            }}
          >
            <SelectTrigger className="bg-white/70 border-orange-200 focus:border-orange-400">
              <div className="flex items-center">
                <School className="mr-2 h-4 w-4 text-orange-500" />
                <SelectValue placeholder="All Universities" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Universities</SelectItem>
              {universities.map((uni) => (
                <SelectItem key={uni} value={uni}>
                  {uni}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={deptFilter}
            onValueChange={(value) => {
              setDeptFilter(value);
              setPage(1); // Reset to first page on filter change
            }}
          >
            <SelectTrigger className="bg-white/70 border-orange-200 focus:border-orange-400">
              <div className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4 text-orange-500" />
                <SelectValue placeholder="All Departments" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoadingCourses ? (
        <div className="flex justify-center items-center h-60 text-orange-500">
          <div className="animate-spin h-8 w-8 border-4 border-current border-t-transparent rounded-full"></div>
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
              >
                <CardHeader className="bg-gradient-to-r from-orange-100/40 to-amber-100/40 pb-3">
                  <CardTitle className="text-lg font-bold text-orange-800 flex justify-between">
                    <span className="truncate">
                      {course.courseNumber}: {course.courseTitle}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleBookmark(course.id);
                      }}
                      className="text-orange-500 hover:text-orange-700 transition-colors"
                    >
                      {bookmarkedCourseIds.has(course.id) ? (
                        <BookmarkCheck className="h-5 w-5 animate-scale" />
                      ) : (
                        <BookmarkPlus className="h-5 w-5" />
                      )}
                    </button>
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
                      setLocation(`/learning-center/courses/${course.id}`)
                    }
                  >
                    Course Details <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 flex items-center gap-1"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (course.url)
                        window.open(
                          course.url,
                          "_blank",
                          "noopener,noreferrer"
                        );
                    }}
                  >
                    University Site <ExternalLink className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {isLoadingCount && courses.length > 0 ? (
            <div className="flex justify-center mt-8">
              <div className="animate-spin h-6 w-6 border-4 border-orange-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                      className={
                        page === 1 ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>

                  {/* Show first page */}
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

                  {/* Show ellipsis if needed */}
                  {page > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Show previous page */}
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

                  {/* Show next page */}
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

                  {/* Show ellipsis if needed */}
                  {page < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Show last page */}
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
                        page === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )
          )}
        </>
      )}

      {/* Add Course Dialog */}
      <Dialog open={showAddCourseDialog} onOpenChange={setShowAddCourseDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-orange-700 text-xl">
              Add University Course
            </DialogTitle>
            <DialogDescription>
              Share a course from a prestigious university to help other
              learners discover valuable educational resources.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="university"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>University</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Harvard, MIT, Stanford"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        You can enter any university name, including ones not in
                        our system yet
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="courseDept"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. CS, ECON, MATH" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="courseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 101, CS50, 6.006" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="courseTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Introduction to Computer Science"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="professors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professors</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. John Smith, Jane Doe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recentSemesters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recent Semesters</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Fall 2023, Spring 2024"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a brief description of the course content and objectives..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://university.edu/courses/cs101"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Link to the official course page or materials
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddCourseDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  disabled={addCourseMutation.isPending}
                >
                  {addCourseMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span> Submitting...
                    </>
                  ) : (
                    "Add Course"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* CSV Upload Dialog */}
      <SimpleCSVUploader
        open={showCsvUploadDialog}
        onOpenChange={setShowCsvUploadDialog}
        onUploadSuccess={handleCsvUploadSuccess}
        courseType="university"
      />
    </div>
  );
};

export default UniversityCoursesTab;
