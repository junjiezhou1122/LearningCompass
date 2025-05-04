import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ChevronRight, Star, Compass, Search, Filter, ExternalLink, ThumbsUp, MessageSquare } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const LearningToolsTab = () => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pricingFilter, setPricingFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddToolDialog, setShowAddToolDialog] = useState(false);
  const [activeView, setActiveView] = useState('all'); // 'all', 'mine'
  const limit = 9; // Number of tools per page
  
  // Fetch tool categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ['learning-tool-categories'],
    queryFn: async () => {
      const response = await fetch('/api/learning-tool-categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });
  
  // Fetch learning tools with filters and pagination
  const { data: toolsData, isLoading: isLoadingTools } = useQuery({
    queryKey: ['learning-tools', categoryFilter, pricingFilter, searchQuery, activeView, page, limit],
    queryFn: async () => {
      let url = `/api/learning-tools?limit=${limit}&offset=${(page - 1) * limit}`;
      
      if (categoryFilter) {
        url += `&category=${encodeURIComponent(categoryFilter)}`;
      }
      
      if (pricingFilter) {
        url += `&pricing=${encodeURIComponent(pricingFilter)}`;
      }
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      // Filter by current user if viewing 'mine'
      if (activeView === 'mine' && isAuthenticated) {
        url += `&userId=${encodeURIComponent(user.id)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch learning tools');
      
      const tools = await response.json();
      return {
        tools,
        totalCount: tools.length >= limit ? -1 : tools.length // If we got exactly the limit, there might be more
      };
    },
  });
  
  const tools = toolsData?.tools || [];
  const totalPages = Math.ceil((toolsData?.totalCount || 0) / limit);
  
  // Form schema for adding a new learning tool
  const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
    description: z.string().min(20, "Description must be at least 20 characters").max(500, "Description must be less than 500 characters"),
    website: z.string().url("Please enter a valid URL"),
    category: z.string().min(1, "Category is required"),
    pricing: z.enum(["free", "freemium", "paid"]),
    keyFeatures: z.string().min(10, "Key features must be at least 10 characters").max(500, "Key features must be less than 500 characters"),
    useCases: z.string().min(10, "Use cases must be at least 10 characters").max(500, "Use cases must be less than 500 characters"),
  });
  
  // Form for adding a new learning tool
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      website: "https://",
      category: "",
      pricing: "free",
      keyFeatures: "",
      useCases: "",
    },
  });
  
  // Mutation for adding a new learning tool
  const addToolMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/learning-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add learning tool');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Reset form and close dialog
      form.reset();
      setShowAddToolDialog(false);
      
      // Show success toast
      toast({
        title: "Success!",
        description: "Your learning tool has been shared with the community.",
        variant: "default",
      });
      
      // Invalidate query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['learning-tools'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add your learning tool. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for upvoting a learning tool
  const upvoteMutation = useMutation({
    mutationFn: async (toolId) => {
      const response = await fetch(`/api/learning-tools/${toolId}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upvote tool');
      }
      
      return response.json();
    },
    onSuccess: (data, toolId) => {
      // Invalidate the specific tool to update its upvote count
      queryClient.invalidateQueries({ queryKey: ['learning-tools'] });
      
      toast({
        title: "Upvoted!",
        description: "You upvoted this learning tool.",
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
        description: "Please log in to share learning tools.",
        variant: "destructive",
      });
      return;
    }
    
    addToolMutation.mutate(data);
  };
  
  // Function to handle upvoting
  const handleUpvote = (toolId) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upvote learning tools.",
        variant: "destructive",
      });
      return;
    }
    
    upvoteMutation.mutate(toolId);
  };
  
  return (
    <div>
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-orange-700">Learning Tools</h2>
          <p className="text-gray-600">Discover useful tools and applications to enhance your learning experience</p>
        </div>
        
        {isAuthenticated && (
          <Button 
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all duration-300"
            onClick={() => setShowAddToolDialog(true)}
          >
            <Compass className="h-4 w-4 mr-2" />
            Share a Tool
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
            All Tools
          </TabsTrigger>
          {isAuthenticated && (
            <TabsTrigger 
              value="mine" 
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-md"
            >
              My Shared Tools
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
              placeholder="Search learning tools..."
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
            value={categoryFilter} 
            onValueChange={(value) => {
              setCategoryFilter(value);
              setPage(1); // Reset to first page on filter change
            }}
          >
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
          
          <Select 
            value={pricingFilter} 
            onValueChange={(value) => {
              setPricingFilter(value);
              setPage(1); // Reset to first page on filter change
            }}
          >
            <SelectTrigger className="bg-white/70 border-orange-200 focus:border-orange-400">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4 text-orange-500" />
                <SelectValue placeholder="All Pricing" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Pricing</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="freemium">Freemium</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoadingTools ? (
        <div className="flex justify-center items-center h-60 text-orange-500">
          <div className="animate-spin h-8 w-8 border-4 border-current border-t-transparent rounded-full"></div>
        </div>
      ) : tools.length === 0 ? (
        <div className="text-center py-12 bg-white/50 rounded-xl border border-orange-100">
          <div className="mx-auto w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-orange-100">
            <Compass className="h-10 w-10 text-orange-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {activeView === 'mine' ? "You haven't shared any learning tools yet" : "No learning tools found"}
          </h3>
          <p className="text-gray-500 mb-6">
            {activeView === 'mine' 
              ? "Share your favorite learning tools with the community" 
              : "Try adjusting your filters or search terms"}
          </p>
          
          {activeView === 'mine' && isAuthenticated && (
            <Button 
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              onClick={() => setShowAddToolDialog(true)}
            >
              <Compass className="h-4 w-4 mr-2" />
              Share a Learning Tool
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <Card key={tool.id} className="overflow-hidden border-orange-100 hover:border-orange-300 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
                <CardHeader className="bg-gradient-to-r from-orange-100/40 to-amber-100/40 pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold text-orange-800">
                      {tool.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-orange-500 hover:text-orange-700 hover:bg-orange-100" 
                        onClick={() => handleUpvote(tool.id)}
                      >
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          <span className="text-sm">{tool.upvotes}</span>
                        </div>
                      </Button>
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
                  <CardDescription className="text-gray-700 mt-2">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-3">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-orange-800 mb-1">Key Features:</h4>
                      <p className="text-gray-700 text-sm">{tool.keyFeatures}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-orange-800 mb-1">Use Cases:</h4>
                      <p className="text-gray-700 text-sm">{tool.useCases}</p>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between border-t border-orange-100 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{tool.views} views</span>
                  </div>
                  
                  <Button asChild variant="ghost" className="text-orange-600 hover:text-orange-800 hover:bg-orange-50">
                    <a href={tool.website} target="_blank" rel="noopener noreferrer" className="flex items-center">
                      Visit Website <ExternalLink className="h-4 w-4 ml-1" />
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
      
      {/* Dialog for adding a new learning tool */}
      <Dialog open={showAddToolDialog} onOpenChange={setShowAddToolDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-orange-700">Share a Learning Tool</DialogTitle>
            <DialogDescription>
              Share your favorite learning tool or application with the community. Provide details to help others discover useful resources.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tool Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="E.g., Notion, Anki, Quizlet" 
                        {...field} 
                        className="border-orange-200 focus-visible:ring-orange-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://www.example.com" 
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
                  name="pricing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pricing Model</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-orange-200 focus:ring-orange-400">
                            <SelectValue placeholder="Select pricing" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="freemium">Freemium</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-orange-200 focus:ring-orange-400">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Note Taking">Note Taking</SelectItem>
                        <SelectItem value="Flashcards">Flashcards</SelectItem>
                        <SelectItem value="Mind Mapping">Mind Mapping</SelectItem>
                        <SelectItem value="Productivity">Productivity</SelectItem>
                        <SelectItem value="Language Learning">Language Learning</SelectItem>
                        <SelectItem value="Practice & Testing">Practice & Testing</SelectItem>
                        <SelectItem value="Organization">Organization</SelectItem>
                        <SelectItem value="Collaboration">Collaboration</SelectItem>
                        <SelectItem value="Research">Research</SelectItem>
                        <SelectItem value="AI-assisted Learning">AI-assisted Learning</SelectItem>
                        <SelectItem value="Educational Games">Educational Games</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
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
                        placeholder="Describe what this tool does and how it helps with learning..." 
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
                name="keyFeatures"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Features</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List the main features that make this tool valuable for learning..." 
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
                name="useCases"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Use Cases</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe how you use this tool for learning and in what situations it's most helpful..." 
                        {...field} 
                        className="min-h-20 border-orange-200 focus-visible:ring-orange-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddToolDialog(false)}
                  className="border-orange-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  disabled={addToolMutation.isPending}
                >
                  {addToolMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Sharing...
                    </>
                  ) : (
                    "Share Tool"
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

export default LearningToolsTab;