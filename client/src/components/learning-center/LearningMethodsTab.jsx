import React, { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertCircle, User, Star, Lightbulb, Search, Filter, ThumbsUp, MessageSquare, Eye } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const LearningMethodsTab = () => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMethodDialog, setShowAddMethodDialog] = useState(false);
  const [activeView, setActiveView] = useState('all'); // 'all', 'mine', 'bookmarked'
  const limit = 6; // Number of methods per page
  
  // Fetch learning method tags for filter
  const { data: tags = [] } = useQuery({
    queryKey: ['learning-method-tags'],
    queryFn: async () => {
      const response = await fetch('/api/learning-method-tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      return response.json();
    },
  });
  
  // Fetch learning methods with filters and pagination
  const { data: methodsData, isLoading: isLoadingMethods } = useQuery({
    queryKey: ['learning-methods', difficultyFilter, tagFilter, searchQuery, activeView, page, limit],
    queryFn: async () => {
      let url = `/api/learning-methods?limit=${limit}&offset=${(page - 1) * limit}`;
      
      if (difficultyFilter && difficultyFilter !== 'all') {
        url += `&difficulty=${encodeURIComponent(difficultyFilter)}`;
      }
      
      if (tagFilter && tagFilter !== 'all') {
        url += `&tag=${encodeURIComponent(tagFilter)}`;
      }
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      // Filter by current user if viewing 'mine'
      if (activeView === 'mine' && isAuthenticated) {
        url += `&userId=${encodeURIComponent(user.id)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch learning methods');
      
      const methods = await response.json();
      return {
        methods,
        totalCount: methods.length >= limit ? -1 : methods.length // If we got exactly the limit, there might be more
      };
    },
  });
  
  const methods = methodsData?.methods || [];
  const totalPages = Math.ceil((methodsData?.totalCount || 0) / limit);
  
  // Form schema for adding a new learning method
  const formSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
    description: z.string().min(20, "Description must be at least 20 characters").max(1000, "Description must be less than 1000 characters"),
    tags: z.string().refine(tags => tags.split(',').length > 0, {
      message: "Please provide at least one tag"
    }).refine(tags => tags.split(',').every(tag => tag.trim().length > 0), {
      message: "Tags cannot be empty"
    }),
    steps: z.string().min(20, "Steps must be at least 20 characters").max(2000, "Steps must be less than 2000 characters"),
  });
  
  // Form for adding a new learning method
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "",
      steps: "",
    },
  });
  
  // Mutation for adding a new learning method
  const addMethodMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/learning-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add learning method');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Reset form and close dialog
      form.reset();
      setShowAddMethodDialog(false);
      
      // Show success toast
      toast({
        title: "Success!",
        description: "Your learning method has been shared with the community.",
        variant: "default",
      });
      
      // Invalidate query to refresh the list with the exact structure as the query key
      queryClient.invalidateQueries({
        queryKey: ['learning-methods', difficultyFilter, tagFilter, searchQuery, activeView, page, limit],
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add your learning method. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for upvoting a learning method
  const upvoteMutation = useMutation({
    mutationFn: async (methodId) => {
      const response = await fetch(`/api/learning-methods/${methodId}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upvote method');
      }
      
      return response.json();
    },
    onSuccess: (data, methodId) => {
      // Invalidate the specific method to update its upvote count
      queryClient.invalidateQueries({
        queryKey: ['learning-methods', difficultyFilter, tagFilter, searchQuery, activeView, page, limit]
      });
      
      toast({
        title: "Upvoted!",
        description: "You upvoted this learning method.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upvote. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Function to handle form submission
  const onSubmit = (data) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to share your learning method.",
        variant: "destructive",
      });
      return;
    }
    
    // Transform tags and steps into arrays for the backend
    const transformedData = {
      ...data,
      tags: data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      steps: data.steps.split('\n').map(step => step.trim()).filter(step => step.length > 0)
    };
    
    addMethodMutation.mutate(transformedData);
  };
  
  // Function to handle upvoting
  const handleUpvote = (methodId) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upvote learning methods.",
        variant: "destructive",
      });
      return;
    }
    
    upvoteMutation.mutate(methodId);
  };
  
  return (
    <div>
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-orange-700">Learning Methods</h2>
          <p className="text-gray-600">Discover and share effective learning techniques with the community</p>
        </div>
        
        {isAuthenticated && (
          <Button 
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all duration-300"
            onClick={() => setShowAddMethodDialog(true)}
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Share Your Method
          </Button>
        )}
      </div>
      
      {/* Tabs for different views */}
      <Tabs value={activeView} onValueChange={setActiveView} className="mb-6">
        <TabsList className="bg-orange-100/70 p-1">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-md"
          >
            All Methods
          </TabsTrigger>
          {isAuthenticated && (
            <TabsTrigger 
              value="mine" 
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-md"
            >
              My Methods
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>
      
      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl shadow-md">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search learning methods..."
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
            value={difficultyFilter} 
            onValueChange={(value) => {
              setDifficultyFilter(value);
              setPage(1); // Reset to first page on filter change
            }}
          >
            <SelectTrigger className="bg-white/70 border-orange-200 focus:border-orange-400">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4 text-orange-500" />
                <SelectValue placeholder="All Difficulty Levels" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulty Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={tagFilter} 
            onValueChange={(value) => {
              setTagFilter(value);
              setPage(1); // Reset to first page on filter change
            }}
          >
            <SelectTrigger className="bg-white/70 border-orange-200 focus:border-orange-400">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4 text-orange-500" />
                <SelectValue placeholder="All Tags" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoadingMethods ? (
        <div className="flex justify-center items-center h-60 text-orange-500">
          <div className="animate-spin h-8 w-8 border-4 border-current border-t-transparent rounded-full"></div>
        </div>
      ) : methods.length === 0 ? (
        <div className="text-center py-12 bg-white/50 rounded-xl border border-orange-100">
          <div className="mx-auto w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-orange-100">
            <Lightbulb className="h-10 w-10 text-orange-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {activeView === 'mine' ? "You haven't shared any learning methods yet" : "No learning methods found"}
          </h3>
          <p className="text-gray-500 mb-6">
            {activeView === 'mine' 
              ? "Share your learning techniques with the community" 
              : "Try adjusting your filters or search terms"}
          </p>
          
          {activeView === 'mine' && isAuthenticated && (
            <Button 
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              onClick={() => setShowAddMethodDialog(true)}
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Share Learning Method
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {methods.map((method) => (
              <Card key={method.id} className="overflow-hidden border-orange-100 hover:border-orange-300 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
                <CardHeader className="bg-gradient-to-r from-orange-100/40 to-amber-100/40 pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold text-orange-800">
                      {method.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-orange-500 hover:text-orange-700 hover:bg-orange-100" 
                        onClick={() => handleUpvote(method.id)}
                      >
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          <span className="text-sm">{method.upvotes}</span>
                        </div>
                      </Button>
                      {method.difficulty ? (
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
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {method.tags && Array.isArray(method.tags) && method.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <CardDescription className="text-gray-700 mt-2">
                    {method.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-3">
                  <h4 className="font-medium text-orange-800 mb-2">Steps:</h4>
                  {Array.isArray(method.steps) ? (
                    <ul className="list-disc pl-5 space-y-1 line-clamp-3">
                      {method.steps.map((step, index) => (
                        <li key={index} className="text-gray-700">{step}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-line line-clamp-3">{method.steps}</p>
                  )}
                </CardContent>
                
                <CardFooter className="flex justify-between border-t border-orange-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 bg-orange-200">
                      <AvatarFallback>{method.authorName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-500">{method.authorName || 'Anonymous'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{method.views} views</span>
                    <Link to={`/learning-methods/${method.id}`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-orange-200 text-orange-700 hover:bg-orange-50 flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                  </div>
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
                    className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
      
      {/* Dialog for adding a new learning method */}
      <Dialog open={showAddMethodDialog} onOpenChange={setShowAddMethodDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-orange-700">Share Your Learning Method</DialogTitle>
            <DialogDescription>
              Share your effective learning technique with the community. Be detailed and specific to help others learn from your experience.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="E.g., Spaced Repetition Technique" 
                        {...field} 
                        className="border-orange-200 focus-visible:ring-orange-400"
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A brief description of your learning method..." 
                        {...field} 
                        className="min-h-20 border-orange-200 focus-visible:ring-orange-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="memory,focus,recall (comma separated)" 
                        {...field} 
                        className="border-orange-200 focus-visible:ring-orange-400"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Separate tags with commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="steps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Step-by-Step Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide detailed steps on how to implement this learning method..." 
                        {...field} 
                        className="min-h-32 border-orange-200 focus-visible:ring-orange-400"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Be clear and detailed. This will help others understand and implement your method effectively.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddMethodDialog(false)}
                  className="border-orange-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  disabled={addMethodMutation.isPending}
                >
                  {addMethodMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Sharing...
                    </>
                  ) : (
                    "Share Method"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LearningMethodsTab;