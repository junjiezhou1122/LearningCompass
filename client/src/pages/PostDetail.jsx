import React, { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Heart, 
  MessageSquare, 
  Bookmark,
  BookmarkPlus,
  Lightbulb, 
  BookOpen, 
  Calendar,
  Share2,
  ArrowLeft,
  Send,
  MoreVertical,
  Trash,
  Eye,
} from 'lucide-react';

export default function PostDetail() {
  // Get postId from URL params
  const [match, params] = useRoute('/post/:id');
  const [, navigate] = useLocation();
  
  // Get current user
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  
  // State for new comment
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  
  // Fetch post details
  const { data: post, isLoading: isPostLoading } = useQuery({
    queryKey: ['/api/learning-posts', parseInt(params?.id)],
    queryFn: async () => {
      if (!params?.id) return null;
      
      const response = await fetch(`/api/learning-posts/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }
      
      return await response.json();
    },
    enabled: !!params?.id,
  });
  
  // Fetch comments for post
  const { data: comments = [], isLoading: isCommentsLoading } = useQuery({
    queryKey: ['/api/learning-posts', parseInt(params?.id), 'comments'],
    queryFn: async () => {
      if (!params?.id) return [];
      
      const response = await fetch(`/api/learning-posts/${params.id}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      return await response.json();
    },
    enabled: !!params?.id,
    staleTime: 5000, // Only consider data fresh for 5 seconds
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });
  
  // Auto-refresh comments periodically
  useEffect(() => {
    if (params?.id) {
      const intervalId = setInterval(() => {
        // Refresh post and comments data
        queryClient.invalidateQueries({ queryKey: ['/api/learning-posts', parseInt(params.id)] });
        queryClient.invalidateQueries({ queryKey: ['/api/learning-posts', parseInt(params.id), 'comments'] });
      }, 10000); // Refresh every 10 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [params?.id, queryClient]);
  
  // Check if the post is liked by the user
  useEffect(() => {
    if (isAuthenticated && post) {
      const checkLikedStatus = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/learning-posts/${post.id}/like`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setLiked(data.liked === true);
            setLikeCount(data.count || 0);
          }
        } catch (error) {
          console.error('Error checking like status:', error);
        }
      };
      
      const checkBookmarkStatus = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/learning-posts/${post.id}/bookmark`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setBookmarked(data.bookmarked === true);
          }
        } catch (error) {
          console.error('Error checking bookmark status:', error);
        }
      };
      
      checkLikedStatus();
      checkBookmarkStatus();
    }
  }, [isAuthenticated, post]);
  
  // Mutation for liking/unliking a post
  const likePostMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !post) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to like posts",
          variant: "destructive",
        });
        return;
      }
      
      const token = localStorage.getItem('token');
      const method = liked ? 'DELETE' : 'POST';
      
      const response = await fetch(`/api/learning-posts/${post.id}/like`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to like post');
      }
      
      const result = await response.json();
      
      return { 
        liked: result.liked !== undefined ? result.liked : !liked,
        count: result.count || 0
      };
    },
    onSuccess: (data) => {
      if (data) {
        setLiked(data.liked);
        setLikeCount(data.count);
        
        toast({
          description: data.liked ? "Post liked" : "Post unliked",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like post. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for bookmarking/unbookmarking a post
  const bookmarkPostMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !post) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to bookmark posts",
          variant: "destructive",
        });
        return;
      }
      
      const token = localStorage.getItem('token');
      const method = bookmarked ? 'DELETE' : 'POST';
      
      const response = await fetch(`/api/learning-posts/${post.id}/bookmark`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to bookmark post');
      }
      
      const result = await response.json();
      
      return { 
        bookmarked: result.bookmarked !== undefined ? result.bookmarked : !bookmarked
      };
    },
    onSuccess: (data) => {
      if (data) {
        setBookmarked(data.bookmarked);
        
        toast({
          description: data.bookmarked ? "Post saved to bookmarks" : "Post removed from bookmarks",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to bookmark post. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for adding a comment
  const addCommentMutation = useMutation({
    mutationFn: async (content) => {
      if (!isAuthenticated || !post) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to comment",
          variant: "destructive",
        });
        return;
      }
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/learning-posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add comment');
      }
      
      return await response.json();
    },
    onSuccess: (newComment) => {
      // Invalidate the comments query for this post's detail view
      queryClient.invalidateQueries({ queryKey: ['/api/learning-posts', parseInt(params?.id), 'comments'] });
      
      // Also invalidate the main post list to update comment counts there
      queryClient.invalidateQueries({ queryKey: ['/api/learning-posts'] });
      
      // Reset the new comment field
      setNewComment('');
      
      // If we have existing comments data, optimistically update it
      if (comments && Array.isArray(comments)) {
        const updatedComments = [...comments, newComment];
        queryClient.setQueryData(
          ['/api/learning-posts', parseInt(params?.id), 'comments'], 
          updatedComments
        );
      }
      
      toast({
        description: "Comment added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for deleting a comment
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      if (!isAuthenticated) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to delete comments",
          variant: "destructive",
        });
        return;
      }
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/learning-post-comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete comment');
      }
      
      return { commentId };
    },
    onSuccess: (data) => {
      // Refresh comments in the post detail view
      queryClient.invalidateQueries({ queryKey: ['/api/learning-posts', parseInt(params?.id), 'comments'] });
      
      // Also refresh the main post list to update comment counts there
      queryClient.invalidateQueries({ queryKey: ['/api/learning-posts'] });
      
      // If we have existing comments data, optimistically remove the deleted comment
      if (comments && Array.isArray(comments) && data && data.commentId) {
        const updatedComments = comments.filter(comment => comment.id !== data.commentId);
        queryClient.setQueryData(
          ['/api/learning-posts', parseInt(params?.id), 'comments'], 
          updatedComments
        );
      }
      
      toast({
        description: "Comment deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle adding a comment
  const handleAddComment = () => {
    if (!newComment.trim() || !isAuthenticated) return;
    addCommentMutation.mutate(newComment);
  };
  
  // Loading state
  if (isPostLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center py-10">
            <p>Loading post...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Not found state
  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col justify-center items-center py-10">
            <h2 className="text-2xl font-bold mb-4">Post not found</h2>
            <Button 
              variant="outline" 
              onClick={() => navigate('/share')}
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Posts
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6 hover:bg-orange-100 hover:text-orange-700 transition-all duration-300 group"
          onClick={() => navigate('/share')}
        >
          <ArrowLeft size={16} className="mr-2 transform group-hover:translate-x-[-2px] transition-transform duration-300" />
          Back to Posts
        </Button>
        
        <Card className="mb-8 overflow-hidden group border border-gray-200 hover:border-orange-200 transition-all duration-300 shadow-sm hover:shadow-md">
          {/* Animated gradient top bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-orange-300 via-orange-500 to-amber-500 transform origin-left scale-x-100"></div>
                
          <CardHeader className="pb-3 transition-colors duration-300 group-hover:bg-orange-50/50">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-4">
                <Avatar className="h-12 w-12 border-2 border-orange-100 transition-all duration-300 group-hover:border-orange-300 group-hover:shadow-md">
                  <AvatarFallback className="bg-orange-100 text-orange-800 text-lg font-semibold transition-colors duration-300 group-hover:bg-orange-200">
                    {post.user?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl font-bold transition-colors duration-300 group-hover:text-orange-700">{post.title}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center mt-1 gap-x-2">
                    <span className="font-medium">{post.user?.username || 'Anonymous'}</span>
                    <span className="inline-block mx-1">•</span>
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1 text-orange-400" />
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className="inline-block mx-1">•</span>
                    <div className="flex items-center">
                      <Eye size={14} className="mr-1 text-blue-400" />
                      <span>{post.views || 0} views</span>
                    </div>
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Badge 
                  variant={post.type === 'thought' ? 'secondary' : 'outline'} 
                  className="text-sm px-3 py-1 transition-all duration-300 group-hover:shadow-sm"
                >
                  {post.type === 'thought' ? (
                    <Lightbulb size={14} className="mr-1 text-amber-500" />
                  ) : (
                    <BookOpen size={14} className="mr-1 text-blue-500" />
                  )}
                  {post.type === 'thought' ? 'Thought' : 'Resource'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="transition-colors duration-300 group-hover:bg-orange-50/30">
            <div className="prose prose-orange max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap text-base leading-relaxed transition-colors duration-300 group-hover:text-gray-900">{post.content}</p>
              
              {post.type === 'resource' && post.resourceLink && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 transition-all duration-300 group-hover:shadow-sm">
                  <h3 className="text-lg font-medium mb-2 flex items-center text-blue-800">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Resource Link
                  </h3>
                  <a 
                    href={post.resourceLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline break-all transform transition-all duration-300 hover:translate-x-1"
                  >
                    {post.resourceLink}
                  </a>
                </div>
              )}
              
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {post.tags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="outline"
                      className="cursor-pointer transition-all duration-300 hover:bg-orange-100 hover:text-orange-800 hover:scale-105"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="border-t pt-4 flex flex-wrap items-center justify-between gap-4 bg-gray-50 group-hover:bg-orange-50 transition-colors duration-300">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`${liked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-all duration-300 hover:scale-110`}
                onClick={() => likePostMutation.mutate()}
              >
                <Heart className={`mr-1 h-5 w-5 transform transition-transform duration-300 ${liked ? 'scale-110' : ''}`} fill={liked ? 'currentColor' : 'none'} />
                <span>{likeCount || 0}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-500 hover:text-amber-500 transition-all duration-300 hover:scale-110"
                onClick={() => {
                  document.getElementById('comment-input').focus();
                }}
              >
                <MessageSquare className="mr-1 h-5 w-5" />
                <span>{comments?.length || 0}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className={`${bookmarked ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-500 transition-all duration-300 hover:scale-110`}
                onClick={() => bookmarkPostMutation.mutate()}
              >
                {bookmarked ? (
                  <Bookmark className="h-5 w-5 transform scale-110" fill="currentColor" />
                ) : (
                  <BookmarkPlus className="h-5 w-5" />
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-500 hover:text-green-500 transition-all duration-300 hover:scale-110"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({
                    description: "Link copied to clipboard",
                  });
                }}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        {/* Comments Section */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">
            Comments ({comments?.length || 0})
          </h3>
          
          {isAuthenticated ? (
            <div className="mb-6 flex space-x-3 group">
              <Avatar className="h-10 w-10 mt-1 hidden sm:block border-2 border-orange-100 group-focus-within:border-orange-300 transition-colors duration-300">
                <AvatarFallback className="bg-orange-100 text-orange-800 group-focus-within:bg-orange-200 transition-colors duration-300">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex flex-col space-y-2">
                <Textarea 
                  id="comment-input"
                  placeholder="Add your thoughts..." 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 transition-all duration-300 focus:border-orange-300 focus:ring-orange-200 min-h-[80px]"
                />
                <div className="self-end">
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600 transition-all duration-300 hover:shadow-md transform hover:translate-y-[-2px]"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-5 border border-amber-200 bg-amber-50 rounded-lg text-center hover:bg-amber-100 transition-colors duration-300 shadow-sm hover:shadow">
              <p className="text-amber-800 font-medium">Sign in to join the conversation</p>
              <p className="text-amber-600 text-sm mt-1">Your insights help everyone learn better</p>
            </div>
          )}
          
          {isCommentsLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-pulse flex space-x-4 w-full">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="p-4 border border-gray-100 rounded-lg hover:border-orange-200 transition-all duration-300 hover:shadow-sm group">
                  <div className="flex justify-between">
                    <div className="flex items-center mb-2">
                      <Avatar className="h-8 w-8 mr-2 border border-orange-100 group-hover:border-orange-300 transition-all duration-300">
                        <AvatarFallback className="bg-gray-100 text-gray-800 group-hover:bg-orange-100 transition-colors duration-300">
                          {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium group-hover:text-orange-700 transition-colors duration-300">{comment.user?.username || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={10} className="inline text-orange-400 opacity-75" />
                          {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    {isAuthenticated && user?.id === comment.userId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full opacity-70 hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all duration-300 hover:scale-110"
                          >
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-red-600 cursor-pointer hover:bg-red-50"
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  <p className="text-gray-700 whitespace-pre-line mt-2 px-2 py-1 group-hover:bg-orange-50/50 rounded transition-colors duration-300">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-lg hover:border-orange-200 transition-all duration-700">
              <MessageSquare className="mx-auto h-10 w-10 mb-2 animate-pulse text-orange-300" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}