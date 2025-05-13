import React, { useState } from "react";
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
import UniversityCourseCard from "./university_courses_components/UniversityCourseCard";
import UniversityCoursesFilters from "./university_courses_components/UniversityCoursesFilters";
import UniversityCoursesHeader from "./university_courses_components/UniversityCoursesHeader";
import UniversityCoursesPagination from "./university_courses_components/UniversityCoursesPagination";
import AddUniversityCourseDialog from "./university_courses_components/AddUniversityCourseDialog";
import useUniversityCoursesData from "@/hooks/useUniversityCoursesData";

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

  // Remove all useQuery/useMutation logic and replace with hook usage
  const {
    universities,
    isLoadingUniversities,
    departments,
    isLoadingDepartments,
    countData,
    isLoadingCount,
    coursesData,
    isLoadingCourses,
    bookmarks,
    isLoadingBookmarks,
    bookmarkedCourseIds,
    addCourseMutation,
    onSubmit,
    toggleBookmark,
  } = useUniversityCoursesData({
    universityFilter,
    deptFilter,
    searchQuery,
    page,
    limit,
    isAuthenticated,
    toast,
    form,
    setShowAddCourseDialog,
  });

  const courses = coursesData || [];
  const totalCount = countData || 0;
  const totalPages = Math.ceil(totalCount / limit);

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
      <UniversityCoursesHeader
        isAuthenticated={isAuthenticated}
        onAddCourse={() => setShowAddCourseDialog(true)}
        onImportCsv={() => setShowCsvUploadDialog(true)}
      />

      {/* Filters and search */}
      <UniversityCoursesFilters
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        universityFilter={universityFilter}
        onUniversityChange={(value) => {
          setUniversityFilter(value);
          setDeptFilter("all");
          setPage(1);
        }}
        universities={universities}
        deptFilter={deptFilter}
        onDeptChange={(value) => {
          setDeptFilter(value);
          setPage(1);
        }}
        departments={departments}
      />

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
              <UniversityCourseCard
                key={course.id}
                course={course}
                isBookmarked={bookmarkedCourseIds.has(course.id)}
                onToggleBookmark={toggleBookmark}
                onDetails={(id) => setLocation(`/learning-center/courses/${id}`)}
              />
            ))}
          </div>

          <UniversityCoursesPagination
            page={page}
            totalPages={totalPages}
            isLoadingCount={isLoadingCount}
            coursesLength={courses.length}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Add Course Dialog */}
      <AddUniversityCourseDialog
        open={showAddCourseDialog}
        onOpenChange={setShowAddCourseDialog}
        form={form}
        onSubmit={onSubmit}
        addCourseMutation={addCourseMutation}
      />

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
