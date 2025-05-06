import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Rating } from '@/components/ui/rating';

import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  MessageSquare,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react';

// Review form schema
const reviewSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  content: z.string().min(10, 'Review must be at least 10 characters').max(1000, 'Review must be less than 1000 characters'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
});

const LearningToolDetail = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch learning tool details
  const { data: tool, isLoading, isError, error } = useQuery({
    queryKey: [`learning-tools/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/learning-tools/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch tool details');
      }
      return response.json();
    },
  });
  
  // Fetch reviews for this tool
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: [`learning-tools/${id}/reviews`],
    queryFn: async () => {
      const response = await fetch(`/api/learning-tools/${id}/reviews`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch reviews');
      }
      return response.json();
    },
    enabled: !!id,
  });
  
  // Form for adding a new review
  const form = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      title: '',
      content: '',
      rating: 0,
    },
  });
  
  // Mutation for adding a review
  const addReviewMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`/api/learning-tools/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...data,
          toolId: parseInt(id),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add review');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Reset form
      form.reset();
      
      // Show success toast
      toast({
        title: 'Review Added',
        description: 'Your review has been published successfully.',
        variant: 'default',
      });
      
      // Refresh reviews
      queryClient.invalidateQueries({ queryKey: [`learning-tools/${id}/reviews`] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add your review. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for deleting a review
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      const response = await fetch(`/api/learning-tools/${id}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete review');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: 'Review Deleted',
        description: 'Your review has been deleted successfully.',
        variant: 'default',
      });
      
      // Refresh reviews
      queryClient.invalidateQueries({ queryKey: [`learning-tools/${id}/reviews`] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete your review. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for upvoting a tool
  const upvoteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/learning-tools/${id}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upvote tool');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Refresh tool details
      queryClient.invalidateQueries({ queryKey: [`learning-tools/${id}`] });
      
      // Show success toast
      toast({
        title: 'Upvoted!',
        description: 'You upvoted this learning tool.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upvote. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Function to handle review submission
  const onSubmit = (data) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to share your review.',
        variant: 'destructive',
      });
      return;
    }
    
    addReviewMutation.mutate(data);
  };
  
  // Function to handle review deletion
  const handleDeleteReview = (reviewId) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to delete your review.',
        variant: 'destructive',
      });
      return;
    }
    
    deleteReviewMutation.mutate(reviewId);
  };
  
  // Function to handle upvoting
  const handleUpvote = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to upvote learning tools.',
        variant: 'destructive',
      });
      return;
    }
    
    upvoteMutation.mutate();
  };
  
  // Calculate average rating
  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };
  
  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Generate initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" className="p-0" onClick={() => setLocation('/learning-center')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
        
        <div className="w-full max-w-4xl mx-auto">
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-32 w-full" />
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-red-100 rounded-full p-4 mb-4">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Tool</h2>
          <p className="text-gray-600 mb-6">{error?.message || 'Failed to load learning tool details'}</p>
          <Button onClick={() => setLocation('/learning-center')}>
            Return to Learning Center
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Back button */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" className="p-0" onClick={() => setLocation('/learning-center')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Learning Tools
        </Button>
      </div>
      
      {/* Tool Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 mb-8 shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-orange-800 mb-2">{tool.name}</h1>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                {tool.category}
              </Badge>
              <Badge
                variant="outline"
                className={`
                  ${tool.pricing === 'free' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                  ${tool.pricing === 'freemium' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                  ${tool.pricing === 'paid' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                `}
              >
                {tool.pricing?.charAt(0).toUpperCase() + tool.pricing?.slice(1) || 'Unknown'}
              </Badge>
              {tool.platforms && tool.platforms.length > 0 && (
                <Badge variant="outline" className="border-orange-200 text-orange-700">
                  {tool.platforms.join(', ')}
                </Badge>
              )}
            </div>
            <p className="text-gray-700">{tool.description}</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center mb-2">
              <div className="flex items-center mr-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-orange-500 hover:text-orange-700 hover:bg-orange-100"
                  onClick={handleUpvote}
                >
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{tool.upvotes || 0}</span>
                  </div>
                </Button>
              </div>
              <div className="flex items-center">
                <Eye className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-500">{tool.views || 0} views</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="flex items-center mr-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(calculateAverageRating()) ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm ml-1">{calculateAverageRating()} ({reviews.length})</span>
              </div>
            </div>
            
            {tool.url && (
              <Button asChild variant="outline" size="sm" className="mt-2 border-orange-200 text-orange-700 hover:bg-orange-50">
                <a href={tool.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <ExternalLink className="h-3 w-3 mr-1" /> Visit Website
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-orange-100/70 p-1">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-md"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="reviews" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-md"
          >
            Reviews ({reviews.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
            {/* Details */}
            <div>
              <h2 className="text-xl font-bold text-orange-700 mb-4">Tool Details</h2>
              
              {/* Pros */}
              {tool.pros && tool.pros.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-green-700 mb-2">Pros:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {tool.pros.map((pro, index) => (
                      <li key={index} className="text-gray-700">{pro}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Cons */}
              {tool.cons && tool.cons.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-red-700 mb-2">Cons:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {tool.cons.map((con, index) => (
                      <li key={index} className="text-gray-700">{con}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Shared by */}
              {tool.user && (
                <div className="flex items-center mt-6">
                  <div className="text-sm text-gray-500">
                    Shared by
                    <Link href={`/user/${tool.userId}`} className="ml-1 text-orange-600 hover:text-orange-800">
                      {tool.user.firstName} {tool.user.lastName}
                    </Link>
                    on {formatDate(tool.createdAt)}
                  </div>
                </div>
              )}
            </div>
            
            {/* Additional Info */}
            <div>
              {/* Alternatives */}
              {tool.alternatives && tool.alternatives.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-orange-700 mb-3">Alternatives</h3>
                  <div className="flex flex-wrap gap-2">
                    {tool.alternatives.map((alt, index) => (
                      <Badge key={index} variant="secondary" className="bg-gray-100 hover:bg-gray-200">
                        {alt}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recent Reviews */}
              <div>
                <h3 className="text-xl font-bold text-orange-700 mb-3">Recent Reviews</h3>
                {isLoadingReviews ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.slice(0, 2).map((review) => (
                      <div key={review.id} className="p-4 border border-orange-100 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src={review.user?.photoURL} />
                              <AvatarFallback className="bg-orange-100 text-orange-800">
                                {getInitials(review.user?.firstName + ' ' + review.user?.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{review.user?.firstName} {review.user?.lastName}</div>
                              <div className="text-sm text-gray-500">{formatDate(review.createdAt)}</div>
                            </div>
                          </div>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <h4 className="font-medium mb-1">{review.title}</h4>
                        <p className="text-gray-700 text-sm">{review.content}</p>
                      </div>
                    ))}
                    
                    {reviews.length > 2 && (
                      <Button 
                        variant="outline"
                        className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                        onClick={() => setActiveTab('reviews')}
                      >
                        View All Reviews
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-6 border border-dashed border-orange-200 rounded-lg">
                    <MessageSquare className="h-10 w-10 text-orange-300 mx-auto mb-2" />
                    <p className="text-gray-500 mb-2">No reviews yet</p>
                    {isAuthenticated && (
                      <Button 
                        variant="outline" 
                        className="text-orange-600 border-orange-200"
                        onClick={() => setActiveTab('reviews')}
                      >
                        Be the first to review
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="reviews" className="mt-6">
          <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
            {/* Review Form */}
            {isAuthenticated ? (
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-orange-700">Share Your Experience</CardTitle>
                    <CardDescription>
                      Write a review to help others learn about this tool
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Review Title</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="E.g., Fantastic learning tool!" 
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
                          name="rating"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rating</FormLabel>
                              <FormControl>
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      className="focus:outline-none"
                                      onClick={() => field.onChange(star)}
                                    >
                                      <svg
                                        className={`h-6 w-6 ${star <= field.value ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors duration-150`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    </button>
                                  ))}
                                  <span className="ml-2 text-sm text-gray-500">
                                    {field.value ? `${field.value} star${field.value !== 1 ? 's' : ''}` : 'Select rating'}
                                  </span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Review</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Share your experience with this tool..." 
                                  {...field} 
                                  className="min-h-[120px] border-orange-200 focus-visible:ring-orange-400"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                          disabled={addReviewMutation.isPending}
                        >
                          {addReviewMutation.isPending ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              Submitting...
                            </>
                          ) : (
                            "Submit Review"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-orange-700">Share Your Experience</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center p-6">
                    <MessageSquare className="h-10 w-10 text-orange-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">Sign in to share your thoughts about this tool</p>
                    <Button 
                      onClick={() => window.location.href = '/api/auth/login'}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    >
                      Sign In
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Reviews List */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-orange-700 mb-6">User Reviews</h2>
              
              {isLoadingReviews ? (
                <div className="space-y-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-6 bg-white border border-orange-100 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={review.user?.photoURL} />
                            <AvatarFallback className="bg-orange-100 text-orange-800">
                              {getInitials(review.user?.firstName + ' ' + review.user?.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{review.user?.firstName} {review.user?.lastName}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" /> {formatDate(review.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex mr-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`h-5 w-5 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          
                          {isAuthenticated && review.userId === user.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteReview(review.id)}
                              disabled={deleteReviewMutation.isPending && deleteReviewMutation.variables === review.id}
                            >
                              {deleteReviewMutation.isPending && deleteReviewMutation.variables === review.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-medium mb-2">{review.title}</h3>
                      <p className="text-gray-700">{review.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-orange-200 rounded-lg">
                  <MessageSquare className="h-12 w-12 text-orange-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Reviews Yet</h3>
                  <p className="text-gray-500 mb-6">Be the first to share your thoughts about this tool</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearningToolDetail;