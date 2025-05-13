import { useQuery, useMutation } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function useUniversityCoursesData({
  universityFilter,
  deptFilter,
  searchQuery,
  page,
  limit,
  isAuthenticated,
  toast,
  form,
  setShowAddCourseDialog,
}) {
  // Fetch universities for filter dropdown
  const { data: universities = [], isLoading: isLoadingUniversities } = useQuery({
    queryKey: ["universities"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/universities");
      if (!response.ok) throw new Error(await response.text() || response.statusText);
      return await response.json();
    },
  });

  // Fetch departments for filter dropdown
  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["course-departments", universityFilter],
    queryFn: async () => {
      const url = universityFilter && universityFilter !== "all"
        ? `/api/course-departments?university=${encodeURIComponent(universityFilter)}`
        : "/api/course-departments";
      const response = await apiRequest("GET", url);
      if (!response.ok) throw new Error(await response.text() || response.statusText);
      return await response.json();
    },
    enabled: true,
  });

  // Fetch total count of university courses with the same filters for pagination
  const { data: countData, isLoading: isLoadingCount } = useQuery({
    queryKey: ["university-courses-count", universityFilter, deptFilter, searchQuery],
    queryFn: async () => {
      let url = `/api/university-courses/count`;
      const params = new URLSearchParams();
      if (universityFilter && universityFilter !== "all") params.append("university", universityFilter);
      if (deptFilter && deptFilter !== "all") params.append("courseDept", deptFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (params.toString()) url += `?${params.toString()}`;
      const response = await apiRequest("GET", url);
      if (!response.ok) throw new Error(await response.text() || response.statusText);
      const data = await response.json();
      return data.count;
    },
  });

  // Fetch university courses with filters and pagination
  const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["university-courses", universityFilter, deptFilter, searchQuery, page, limit],
    queryFn: async () => {
      let url = `/api/university-courses?limit=${limit}&offset=${(page - 1) * limit}`;
      if (universityFilter && universityFilter !== "all") url += `&university=${encodeURIComponent(universityFilter)}`;
      if (deptFilter && deptFilter !== "all") url += `&courseDept=${encodeURIComponent(deptFilter)}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      const response = await apiRequest("GET", url);
      if (!response.ok) throw new Error(await response.text() || response.statusText);
      return await response.json();
    },
  });

  // Fetch user's bookmarked courses
  const { data: bookmarks = [], isLoading: isLoadingBookmarks } = useQuery({
    queryKey: ["university-course-bookmarks"],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await apiRequest("GET", "/api/university-course-bookmarks");
      if (!response.ok) throw new Error(await response.text() || response.statusText);
      return await response.json();
    },
    enabled: isAuthenticated,
  });

  // Create a set of bookmarked course IDs for quick lookup
  const bookmarkedCourseIds = useMemo(() => new Set(bookmarks.map((course) => course.id)), [bookmarks]);

  // Mutation for adding a new university course
  const addCourseMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/university-courses", data);
      if (!response.ok) throw new Error(await response.text() || response.statusText);
      return await response.json();
    },
    onSuccess: () => {
      if (form) form.reset();
      if (setShowAddCourseDialog) setShowAddCourseDialog(false);
      if (toast) toast({ title: "Success!", description: "The university course has been added successfully.", variant: "default" });
      queryClient.invalidateQueries({ queryKey: ["university-courses"] });
      queryClient.invalidateQueries({ queryKey: ["university-courses-count"] });
    },
    onError: (error) => {
      if (toast) toast({ title: "Error", description: error.message || "Failed to add university course. Please try again.", variant: "destructive" });
    },
  });

  // Function to handle form submission
  const onSubmit = useCallback((data) => {
    if (!isAuthenticated) {
      if (toast) toast({ title: "Authentication Required", description: "Please log in to add university courses.", variant: "destructive" });
      return;
    }
    addCourseMutation.mutate(data);
  }, [isAuthenticated, addCourseMutation, toast]);

  // Function to toggle bookmark
  const toggleBookmark = useCallback(async (courseId) => {
    if (!isAuthenticated) {
      if (toast) toast({ title: "Authentication Required", description: "Please log in to bookmark courses.", variant: "destructive" });
      return;
    }
    const isBookmarked = bookmarkedCourseIds.has(courseId);
    try {
      if (isBookmarked) {
        const response = await apiRequest("DELETE", `/api/university-course-bookmarks/${courseId}`);
        if (!response.ok) throw new Error(await response.text() || response.statusText);
      } else {
        const response = await apiRequest("POST", "/api/university-course-bookmarks", { universityCourseId: courseId });
        if (!response.ok) throw new Error(await response.text() || response.statusText);
      }
      queryClient.invalidateQueries({ queryKey: ["university-course-bookmarks"] });
    } catch (error) {
      if (toast) toast({ title: "Error", description: "Failed to update bookmark. Please try again.", variant: "destructive" });
    }
  }, [isAuthenticated, bookmarkedCourseIds, toast]);

  return {
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
  };
} 