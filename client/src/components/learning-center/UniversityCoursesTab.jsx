import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { BookOpen, School, ChevronRight, Search, BookmarkPlus, BookmarkCheck, Filter, Plus, Upload, Download, FileText, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const UniversityCoursesTab = () => {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [universityFilter, setUniversityFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCourseDialog, setShowAddCourseDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);
  const limit = 9; // Number of courses per page
  
  // Fetch universities for filter dropdown
  const { data: universities = [] } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => {
      const response = await fetch('/api/universities');
      if (!response.ok) throw new Error('Failed to fetch universities');
      return response.json();
    },
  });
  
  // Fetch departments for filter dropdown
  const { data: departments = [] } = useQuery({
    queryKey: ['course-departments', universityFilter],
    queryFn: async () => {
      const url = universityFilter 
        ? `/api/course-departments?university=${encodeURIComponent(universityFilter)}` 
        : '/api/course-departments';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch departments');
      return response.json();
    },
    enabled: true, // Always fetch departments
  });
  
  // Fetch university courses with filters and pagination
  const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['university-courses', universityFilter, deptFilter, searchQuery, page, limit],
    queryFn: async () => {
      let url = `/api/university-courses?limit=${limit}&offset=${(page - 1) * limit}`;
      
      if (universityFilter && universityFilter !== 'all') {
        url += `&university=${encodeURIComponent(universityFilter)}`;
      }
      
      if (deptFilter && deptFilter !== 'all') {
        url += `&courseDept=${encodeURIComponent(deptFilter)}`;
      }
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch courses');
      
      const courses = await response.json();
      return {
        courses,
        totalCount: courses.length >= limit ? -1 : courses.length // If we got exactly the limit, there might be more
      };
    },
  });
  
  // Fetch user's bookmarked courses
  const { data: bookmarks = [], isLoading: isLoadingBookmarks } = useQuery({
    queryKey: ['university-course-bookmarks'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      
      const response = await fetch('/api/university-course-bookmarks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) return []; // Not authenticated
        throw new Error('Failed to fetch bookmarks');
      }
      return response.json();
    },
    enabled: isAuthenticated, // Only fetch if authenticated
  });
  
  // Create a set of bookmarked course IDs for quick lookup
  const bookmarkedCourseIds = new Set(bookmarks.map(course => course.id));
  
  const courses = coursesData?.courses || [];
  const totalPages = Math.ceil((coursesData?.totalCount || 0) / limit);
  
  // Form schema for adding a new university course
  const formSchema = z.object({
    university: z.string().min(1, "University is required"),
    courseDept: z.string().min(1, "Department is required"),
    courseNumber: z.string().min(1, "Course number is required"),
    courseTitle: z.string().min(1, "Course title is required"),
    description: z.string().optional(),
    professors: z.string().optional(),
    recentSemesters: z.string().optional(),
    url: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  });

  // Form for adding a new university course
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      university: universities[0] || "",
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
      const response = await fetch('/api/university-courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add university course');
      }
      
      return response.json();
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
      
      // Invalidate query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['university-courses'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add university course. Please try again.",
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

  // Mutation for importing courses from CSV
  const importCsvMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await fetch('/api/university-courses/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import courses');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setImportResults(data);
      setCsvFile(null);
      
      toast({
        title: "Import Successful",
        description: `${data.count} courses imported successfully.`,
        variant: "default",
      });
      
      // Invalidate query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['university-courses'] });
      queryClient.invalidateQueries({ queryKey: ['universities'] });
      queryClient.invalidateQueries({ queryKey: ['course-departments'] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message || "There was an error importing courses. Please check your CSV file and try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setImportLoading(false);
    }
  });

  // Function to handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  // Function to handle CSV import
  const handleImport = () => {
    if (!csvFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to import.",
        variant: "destructive",
      });
      return;
    }

    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', csvFile);
    importCsvMutation.mutate(formData);
  };

  // Function to toggle bookmark
  const toggleBookmark = async (courseId) => {
    if (!isAuthenticated) {
      // Could redirect to login or show a toast
      alert('Please login to bookmark courses');
      return;
    }
    
    const isBookmarked = bookmarkedCourseIds.has(courseId);
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        await fetch(`/api/university-course-bookmarks/${courseId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
      } else {
        // Add bookmark
        await fetch('/api/university-course-bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({ universityCourseId: courseId }),
        });
      }
      
      // Invalidate bookmarks query to refetch
      queryClient.invalidateQueries({ queryKey: ['university-course-bookmarks'] });
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };
  
  return (
    <div>
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-orange-700">University Courses</h2>
          <p className="text-gray-600">Discover courses from leading universities like MIT and Stanford</p>
        </div>
        
        {isAuthenticated && (
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
              onClick={() => window.location.href = '/bookmarks?type=courses'}
            >
              <BookmarkCheck className="h-4 w-4 text-orange-500" />
              View Bookmarked Courses
            </Button>
            <Button 
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex items-center gap-2"
              onClick={() => setShowAddCourseDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Add Course
            </Button>
            {/* Only show import button for authenticated users */}
            <Button 
              variant="outline"
              className="flex items-center gap-2 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
              onClick={() => setShowImportDialog(true)}
            >
              <Upload className="h-4 w-4 text-orange-500" />
              Import CSV
            </Button>
          </div>
        )}
      </div>
      
      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl shadow-md">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
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
                <SelectItem key={uni} value={uni}>{uni}</SelectItem>
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
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
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
          <h3 className="text-lg font-medium text-gray-700 mb-2">No courses found</h3>
          <p className="text-gray-500">Try adjusting your filters or search terms</p>
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
                    <span className="truncate">{course.courseNumber}: {course.courseTitle}</span>
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
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200">
                      {course.university}
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">
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
                      <span className="text-gray-700 font-medium">{course.professors}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Recent Semesters:</span>
                      <span className="text-gray-700 font-medium">{course.recentSemesters}</span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-0 flex justify-between">
                  <Button 
                    variant="outline" 
                    className="text-orange-700 hover:text-orange-800 hover:bg-orange-50 flex items-center gap-1 border-orange-200"
                    onClick={() => setLocation(`/learning-center/courses/${course.id}`)}
                  >
                    Course Details <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 flex items-center gap-1"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (course.url) window.open(course.url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    University Site <ExternalLink className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {/* Pagination */}
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
                    className={page === 1 ? 'pointer-events-none opacity-50' : ''}
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
                    className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
      
      {/* Add Course Dialog */}
      <Dialog open={showAddCourseDialog} onOpenChange={setShowAddCourseDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-orange-700 text-xl">Add University Course</DialogTitle>
            <DialogDescription>
              Share a course from a prestigious university to help other learners discover valuable educational resources.
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select university" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {universities.map((uni) => (
                            <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Input placeholder="e.g. Introduction to Computer Science" {...field} />
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
                      <Input placeholder="e.g. John Smith, Jane Doe" {...field} />
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
                      <Input placeholder="e.g. Fall 2023, Spring 2024" {...field} />
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
                  ) : "Add Course"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-orange-700 text-xl">Import Courses from CSV</DialogTitle>
            <DialogDescription>
              Batch import university courses from a CSV file. The CSV should follow this format: <br />
              <code className="bg-gray-100 p-1 rounded text-xs">university, course_dept, course_number, course_title, description, professors, recent_semesters, url</code>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {importResults && (
              <Alert className={importResults.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                <AlertTitle className={importResults.success ? "text-green-800" : "text-red-800"}>
                  {importResults.success ? "Import Successful" : "Import Failed"}
                </AlertTitle>
                <AlertDescription className={importResults.success ? "text-green-700" : "text-red-700"}>
                  {importResults.message}.
                  {importResults.success && ` Successfully imported ${importResults.count} courses.`}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-300 transition-colors"
                   onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="h-10 w-10 mx-auto mb-4 text-orange-500" />
                {csvFile ? (
                  <p className="text-gray-700">Selected: <span className="font-medium">{csvFile.name}</span></p>
                ) : (
                  <>
                    <p className="text-gray-700 font-medium">Click to select a CSV file</p>
                    <p className="text-gray-500 text-sm mt-1">or drag and drop</p>
                  </>
                )}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".csv"
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h4 className="text-amber-800 font-medium flex items-center gap-2 mb-2">
                  <Download className="h-4 w-4" /> Download Template
                </h4>
                <p className="text-amber-700 text-sm">
                  Need a starting point? Download our CSV template with the correct format.
                </p>
                <Button 
                  variant="link" 
                  className="text-amber-600 hover:text-amber-800 p-0 h-auto mt-1 text-sm"
                  onClick={() => {
                    // Create template CSV content
                    const template = 'university,course_dept,course_number,course_title,description,professors,recent_semesters,url\n' + 
                                    'MIT,CS,6.0001,Introduction to Computer Science,Learn Python programming basics,Prof. Ana Bell,Fall 2022,https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/\n' +
                                    'Stanford,MATH,51,Linear Algebra,Matrices and vector spaces,Prof. John Smith,Spring 2023,https://mathematics.stanford.edu/';
                    
                    // Create download link
                    const element = document.createElement('a');
                    const file = new Blob([template], {type: 'text/csv'});
                    element.href = URL.createObjectURL(file);
                    element.download = 'university_courses_template.csv';
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                >
                  Download CSV Template
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setCsvFile(null);
                  setImportResults(null);
                  setShowImportDialog(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleImport}
                disabled={!csvFile || importLoading}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                {importLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Importing...
                  </>
                ) : "Import Courses"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UniversityCoursesTab;