import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { BookOpen, School, ChevronRight, Search, BookmarkPlus, BookmarkCheck, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';

const UniversityCoursesTab = () => {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [universityFilter, setUniversityFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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
      
      if (universityFilter) {
        url += `&university=${encodeURIComponent(universityFilter)}`;
      }
      
      if (deptFilter) {
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
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
            onClick={() => window.location.href = '/bookmarks?type=courses'}
          >
            <BookmarkCheck className="h-4 w-4 text-orange-500" />
            View Bookmarked Courses
          </Button>
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
              <SelectItem value="">All Universities</SelectItem>
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
              <SelectItem value="">All Departments</SelectItem>
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
              <Card key={course.id} className="overflow-hidden border-orange-100 hover:border-orange-300 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
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
                      <span className="text-gray-500">Credits:</span>
                      <span className="text-gray-700 font-medium">{course.credits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Recent Semesters:</span>
                      <span className="text-gray-700 font-medium">{course.recentSemesters}</span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-0 flex justify-end">
                  <Button asChild variant="ghost" className="text-orange-600 hover:text-orange-800 hover:bg-orange-50">
                    <a href={course.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                      View Course <ChevronRight className="h-4 w-4 ml-1" />
                    </a>
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
    </div>
  );
};

export default UniversityCoursesTab;