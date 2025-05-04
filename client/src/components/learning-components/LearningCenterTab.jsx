import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, School, Lightbulb, Compass, Star, BookmarkPlus, BookmarkCheck, ChevronRight, Search, Filter } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';

const LearningCenterTab = () => {
  const { isAuthenticated } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('courses');
  
  // State for filters
  const [universityFilter, setUniversityFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center md:flex-row md:text-left md:justify-between relative animate-fadeIn">
        {/* Animated background element */}
        <div className="absolute -z-10 w-full h-full opacity-70">
          <div className="absolute top-20 right-20 w-40 h-40 bg-orange-300 rounded-full filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-10 left-20 w-40 h-40 bg-amber-300 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="space-y-5 mb-6 md:mb-0 md:pr-10 md:w-3/5 transform transition-all duration-500 hover:translate-x-2">
          <h2 className="text-3xl font-bold tracking-tight text-orange-600 animate-fadeIn">Learning Center</h2>
          <p className="text-gray-700 text-lg animate-fadeIn animation-delay-300">
            Explore university courses, effective learning methods, and essential learning tools. 
            Whether you're looking for MIT OpenCourseWare, memory techniques, or productivity apps,
            our curated collection has you covered.
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-xl md:w-2/5 shadow-lg border border-amber-100 animate-slideIn">
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white p-5 rounded-lg shadow-sm text-center transform transition-all duration-300 hover:scale-105 hover:shadow-md hover:bg-gradient-to-br hover:from-orange-50 hover:to-amber-50">
              <div className="flex justify-center items-center mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-300 rounded-full filter blur-md opacity-70 animate-pulse"></div>
                  <School className="h-8 w-8 text-orange-600 relative z-10" />
                </div>
              </div>
              <p className="font-medium text-gray-800">Premier Courses</p>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm text-center transform transition-all duration-300 hover:scale-105 hover:shadow-md hover:bg-gradient-to-br hover:from-orange-50 hover:to-amber-50">
              <div className="flex justify-center items-center mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-300 rounded-full filter blur-md opacity-70 animate-pulse"></div>
                  <Lightbulb className="h-8 w-8 text-amber-600 relative z-10" />
                </div>
              </div>
              <p className="font-medium text-gray-800">Learning Methods</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs for different sections */}
      <Tabs defaultValue={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-orange-100/70 to-amber-100/70 rounded-xl border border-orange-200 p-1.5">
          <TabsTrigger 
            value="courses" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
          >
            <School className="mr-2 h-4 w-4" /> University Courses
          </TabsTrigger>
          <TabsTrigger 
            value="methods" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
          >
            <Lightbulb className="mr-2 h-4 w-4" /> Learning Methods
          </TabsTrigger>
          <TabsTrigger 
            value="tools" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
          >
            <Compass className="mr-2 h-4 w-4" /> Learning Tools
          </TabsTrigger>
        </TabsList>
        
        {/* Content for University Courses */}
        <TabsContent value="courses" className="mt-6 animate-fadeIn">
          <UniversityCoursesSection 
            universityFilter={universityFilter}
            setUniversityFilter={setUniversityFilter}
            deptFilter={deptFilter}
            setDeptFilter={setDeptFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </TabsContent>
        
        {/* Content for Learning Methods */}
        <TabsContent value="methods" className="mt-6 animate-fadeIn">
          <LearningMethodsSection 
            difficultyFilter={difficultyFilter}
            setDifficultyFilter={setDifficultyFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </TabsContent>
        
        {/* Content for Learning Tools */}
        <TabsContent value="tools" className="mt-6 animate-fadeIn">
          <LearningToolsSection 
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const UniversityCoursesSection = ({ universityFilter, setUniversityFilter, deptFilter, setDeptFilter, searchQuery, setSearchQuery }) => {
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
  
  // Fetch university courses with filters
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['university-courses', universityFilter, deptFilter, searchQuery],
    queryFn: async () => {
      let url = '/api/university-courses?limit=50';
      
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
      return response.json();
    },
  });
  
  // Fetch user's bookmarked courses
  const { data: bookmarks = [], isLoading: isLoadingBookmarks } = useQuery({
    queryKey: ['university-course-bookmarks'],
    queryFn: async () => {
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
    enabled: true, // We always try to fetch but handle 401 gracefully
  });
  
  // Create a set of bookmarked course IDs for quick lookup
  const bookmarkedCourseIds = new Set(bookmarks.map(course => course.id));
  
  // Function to toggle bookmark
  const toggleBookmark = async (courseId) => {
    const { isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
      // Handle not authenticated - could redirect to login or show a toast
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
    <div className="space-y-6">
      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl shadow-md">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/70 border-orange-200 focus:border-orange-400"
            />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <Select value={universityFilter} onValueChange={setUniversityFilter}>
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
          
          <Select value={deptFilter} onValueChange={setDeptFilter}>
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
      
      {isLoading ? (
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
      )}
    </div>
  );
};

const LearningMethodsSection = ({ difficultyFilter, setDifficultyFilter, searchQuery, setSearchQuery }) => {
  // Fetch learning method tags for filter
  const { data: tags = [] } = useQuery({
    queryKey: ['learning-method-tags'],
    queryFn: async () => {
      const response = await fetch('/api/learning-method-tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      return response.json();
    },
  });
  
  // Fetch learning methods with filters
  const { data: methods = [], isLoading } = useQuery({
    queryKey: ['learning-methods', difficultyFilter, searchQuery],
    queryFn: async () => {
      let url = '/api/learning-methods?limit=50';
      
      if (difficultyFilter) {
        url += `&difficulty=${encodeURIComponent(difficultyFilter)}`;
      }
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch learning methods');
      return response.json();
    },
  });
  
  return (
    <div className="space-y-6">
      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl shadow-md">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search learning methods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/70 border-orange-200 focus:border-orange-400"
            />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="bg-white/70 border-orange-200 focus:border-orange-400">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4 text-orange-500" />
                <SelectValue placeholder="All Difficulty Levels" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Difficulty Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-60 text-orange-500">
          <div className="animate-spin h-8 w-8 border-4 border-current border-t-transparent rounded-full"></div>
        </div>
      ) : methods.length === 0 ? (
        <div className="text-center py-12 bg-white/50 rounded-xl border border-orange-100">
          <div className="mx-auto w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-orange-100">
            <Search className="h-10 w-10 text-orange-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No learning methods found</h3>
          <p className="text-gray-500">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {methods.map((method) => (
            <Card key={method.id} className="overflow-hidden border-orange-100 hover:border-orange-300 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-orange-100/40 to-amber-100/40 pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold text-orange-800">
                    {method.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm flex items-center">
                      <Star className="h-4 w-4 text-amber-400 mr-1" /> {method.upvotes}
                    </span>
                    <Badge
                      variant="outline"
                      className={`
                        ${method.difficulty === 'beginner' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        ${method.difficulty === 'intermediate' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                        ${method.difficulty === 'advanced' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                      `}
                    >
                      {method.difficulty.charAt(0).toUpperCase() + method.difficulty.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {method.tags && method.tags.split(',').map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              
              <CardContent className="pt-3">
                <p className="text-gray-700">{method.description}</p>
              </CardContent>
              
              <CardFooter className="flex justify-between border-t border-orange-100 pt-3">
                <div className="text-sm text-gray-500 flex items-center">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center mr-2">
                    <span className="text-orange-700 text-xs">{method.authorName?.charAt(0) || '?'}</span>
                  </div>
                  {method.authorName || 'Anonymous'}
                </div>
                
                <Button 
                  size="sm" 
                  className="text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200"
                  onClick={() => window.location.href = `/learning-methods/${method.id}`}
                >
                  Learn More
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const LearningToolsSection = ({ categoryFilter, setCategoryFilter, searchQuery, setSearchQuery }) => {
  // Fetch tool categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ['learning-tool-categories'],
    queryFn: async () => {
      const response = await fetch('/api/learning-tool-categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });
  
  // Fetch learning tools with filters
  const { data: tools = [], isLoading } = useQuery({
    queryKey: ['learning-tools', categoryFilter, searchQuery],
    queryFn: async () => {
      let url = '/api/learning-tools?limit=50';
      
      if (categoryFilter) {
        url += `&category=${encodeURIComponent(categoryFilter)}`;
      }
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch learning tools');
      return response.json();
    },
  });
  
  return (
    <div className="space-y-6">
      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl shadow-md">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search learning tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/70 border-orange-200 focus:border-orange-400"
            />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-white/70 border-orange-200 focus:border-orange-400">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4 text-orange-500" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-60 text-orange-500">
          <div className="animate-spin h-8 w-8 border-4 border-current border-t-transparent rounded-full"></div>
        </div>
      ) : tools.length === 0 ? (
        <div className="text-center py-12 bg-white/50 rounded-xl border border-orange-100">
          <div className="mx-auto w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-orange-100">
            <Search className="h-10 w-10 text-orange-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No learning tools found</h3>
          <p className="text-gray-500">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Card key={tool.id} className="overflow-hidden border-orange-100 hover:border-orange-300 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-orange-100/40 to-amber-100/40 pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold text-orange-800">
                    {tool.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm flex items-center">
                      <Star className="h-4 w-4 text-amber-400 mr-1" /> {tool.upvotes}
                    </span>
                    <Badge
                      variant="outline"
                      className={`
                        ${tool.pricing === 'free' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        ${tool.pricing === 'freemium' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                        ${tool.pricing === 'paid' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                      `}
                    >
                      {tool.pricing.charAt(0).toUpperCase() + tool.pricing.slice(1)}
                    </Badge>
                  </div>
                </div>
                <Badge className="mt-1 bg-amber-100 text-amber-800 hover:bg-amber-200">
                  {tool.category}
                </Badge>
                <CardDescription className="text-gray-600 mt-2">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-3">
                <p className="text-gray-700 text-sm">
                  <strong>Key Features:</strong> {tool.keyFeatures}
                </p>
              </CardContent>
              
              <CardFooter className="flex justify-between pt-3 border-t border-orange-100">
                <div className="text-sm text-gray-500">
                  {tool.views} views
                </div>
                
                <Button asChild variant="ghost" className="text-orange-600 hover:text-orange-800 hover:bg-orange-50">
                  <a href={tool.website} target="_blank" rel="noopener noreferrer" className="flex items-center">
                    Visit Website <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearningCenterTab;