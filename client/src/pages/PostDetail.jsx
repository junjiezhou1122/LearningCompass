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
  });
  
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning-posts', parseInt(params?.id), 'comments'] });
      setNewComment('');
      
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning-posts', parseInt(params?.id), 'comments'] });
      
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
          className="mb-6" 
          onClick={() => navigate('/share')}
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Posts
        </Button>
        
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-orange-100 text-orange-800 text-lg">
                    {post.user?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl font-bold">{post.title}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <span className="font-medium">{post.user?.username || 'Anonymous'}</span>
                    <span className="inline-block mx-2">•</span>
                    <Calendar size={14} className="mr-1" />
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    <span className="inline-block mx-2">•</span>
                    <Eye size={14} className="mr-1" />
                    <span>{post.views || 0} views</span>
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant={post.type === 'thought' ? 'secondary' : 'outline'} className="text-sm px-3 py-1">
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
          
          <CardContent>
            <div className="prose prose-orange max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap text-base leading-relaxed">{post.content}</p>
              
              {post.type === 'resource' && post.resourceLink && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="text-lg font-medium mb-2 flex items-center text-blue-800">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Resource Link
                  </h3>
                  <a 
                    href={post.resourceLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block text-blue-600 hover:text-blue-800 hover:underline break-all"
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
                      className="cursor-pointer hover:bg-orange-50"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="border-t pt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`${liked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
                onClick={() => likePostMutation.mutate()}
              >
                <Heart className="mr-1 h-5 w-5" />
                <span>{likeCount || 0}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-500"
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
                className={`${bookmarked ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-500`}
                onClick={() => bookmarkPostMutation.mutate()}
              >
                {bookmarked ? (
                  <Bookmark className="h-5 w-5" />
                ) : (
                  <BookmarkPlus className="h-5 w-5" />
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-500"
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
            <div className="mb-6 flex">
              <Textarea 
                id="comment-input"
                placeholder="Add your thoughts..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 mr-3"
              />
              <Button 
                className="self-end bg-orange-500 hover:bg-orange-600"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                <Send className="mr-2 h-4 w-4" />
                Comment
              </Button>
            </div>
          ) : (
            <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-md text-center">
              <p className="text-amber-800">Sign in to join the conversation</p>
            </div>
          )}
          
          {isCommentsLoading ? (
            <p>Loading comments...</p>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between">
                    <div className="flex items-center mb-2">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback className="bg-gray-100 text-gray-800">
                          {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{comment.user?.username || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    {isAuthenticated && user?.id === comment.userId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-red-600 cursor-pointer"
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  <p className="text-gray-700 whitespace-pre-line mt-2">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="mx-auto h-10 w-10 mb-2" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}