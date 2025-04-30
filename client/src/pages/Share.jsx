import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Avatar,
  AvatarFallback,
  AvatarImage 
} from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Filter, 
  Tag, 
  BookmarkPlus,
  Bookmark,
  Lightbulb, 
  BookOpen, 
  Calendar,
  Plus,
  X,
  Send,
  Trash,
  MoreVertical,
  Edit,
  Search,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

// Predefined tag options
const tagOptions = [
  'productivity', 'focus', 'technique', 'memory', 'retention', 
  'research', 'organization', 'comprehension', 'visualization',
  'strategy', 'creativity', 'motivation', 'psychology', 'science',
  'tools', 'resources', 'habits', 'practice', 'teaching'
];

export default function Share() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'thought',
    tags: [],
    resourceLink: ''
  });
  const [currentTag, setCurrentTag] = useState('');
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [filterTag, setFilterTag] = useState('all-tags');
  const [commentCounts, setCommentCounts] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState({});
  const queryClient = useQueryClient();
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  // For tracking unique tags from all posts
  const [availableTags, setAvailableTags] = useState([]);
  
  // Fetch all learning posts
  const { data: posts = [], isLoading: isPostsLoading } = useQuery({
    queryKey: ['/api/learning-posts'],
    staleTime: 1000 * 30, // 30 seconds instead of 1 minute for more frequent refreshes
  });
  
  // Use useEffect to extract tags and populate comment/like info when posts load
  useEffect(() => {
    if (posts && posts.length > 0) {
      // Extract all unique tags from posts for filtering and search
      const allTags = new Set();
      posts.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach(tag => allTags.add(tag));
        }
      });
      setAvailableTags(Array.from(allTags));
      
      // Single consolidated fetch for all post metadata
      fetchPostMetadata(posts);
    }
  }, [posts, isAuthenticated]);
  
  // Refresh data periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Refresh posts data
      queryClient.invalidateQueries({ queryKey: ['/api/learning-posts'] });
      
      // If there's an expanded post, refresh its comments
      if (expandedPostId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/learning-posts', expandedPostId, 'comments'] 
        });
      }
    }, 10000); // every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [queryClient, expandedPostId]);
  
  // Consolidated function to fetch all post metadata in parallel
  const fetchPostMetadata = async (posts) => {
    if (!posts || posts.length === 0) return;
    
    const token = isAuthenticated ? localStorage.getItem('token') : null;
    const commentCountsObj = {};
    const likedObj = {};
    const bookmarkedObj = {};
    
    // Create an array of promises for parallel execution
    const fetchPromises = posts.map(async (post) => {
      try {
        // Make all requests in parallel
        const [commentCountResponse, userDataResponse] = await Promise.all([
          // Get comment count
          fetch(`/api/learning-posts/${post.id}/comments/count`),
          
          // If authenticated, get like and bookmark status in one request
          isAuthenticated ? fetch(`/api/learning-posts/${post.id}/like`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }) : Promise.resolve(null)
        ]);
        
        // Process comment count
        if (commentCountResponse.ok) {
          const commentData = await commentCountResponse.json();
          commentCountsObj[post.id] = commentData.count;
          post.commentCount = commentData.count;
        }
        
        // Process like status and count (if authenticated)
        if (userDataResponse && userDataResponse.ok) {
          const likeData = await userDataResponse.json();
          likedObj[post.id] = likeData.liked === true;
          post.likeCount = likeData.count || 0;
          post.likes = likeData.count || 0;
          
          // Also get bookmark status
          const bookmarkResponse = await fetch(`/api/learning-posts/${post.id}/bookmark`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (bookmarkResponse.ok) {
            const bookmarkData = await bookmarkResponse.json();
            bookmarkedObj[post.id] = bookmarkData.bookmarked === true;
          }
        }
      } catch (error) {
        console.error(`Error fetching metadata for post ${post.id}:`, error);
      }
    });
    
    // Wait for all promises to complete
    await Promise.all(fetchPromises);
    
    // Update state with all the collected data
    setCommentCounts(commentCountsObj);
    if (isAuthenticated) {
      setLikedPosts(likedObj);
      setBookmarkedPosts(bookmarkedObj);
    }
  };
  
  // Mutation for creating a new post
  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/learning-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Add authorization header
        },
        body: JSON.stringify(postData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create post');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning-posts'] });
      toast({
        title: "Success!",
        description: "Your post has been published.",
      });
      
      // Reset form
      setNewPost({
        title: '',
        content: '',
        type: 'thought',
        tags: [],
        resourceLink: ''
      });
      setShowNewPostForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Fetch comments for the expanded post
  const { data: commentsData = {}, isLoading: isCommentsLoading } = useQuery({
    queryKey: ['/api/learning-posts', expandedPostId, 'comments'],
    queryFn: async () => {
      if (!expandedPostId) return {};
      
      const response = await fetch(`/api/learning-posts/${expandedPostId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const comments = await response.json();
      return { [expandedPostId]: comments };
    },
    enabled: expandedPostId !== null,
    staleTime: 5000, // Consider data fresh for only 5 seconds
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });
  
  // Mutation for adding a comment
  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content }) => {
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/learning-posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Add authorization header
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add comment');
      }
      
      return await response.json();
    },
    onSuccess: async (data, variables) => {
      // Invalidate the comments query for this post
      queryClient.invalidateQueries({ queryKey: ['/api/learning-posts', variables.postId, 'comments'] });
      
      // Fetch the updated comment count from the server
      try {
        const response = await fetch(`/api/learning-posts/${variables.postId}/comments/count`);
        if (response.ok) {
          const countData = await response.json();
          
          // Update the comment count in our local state
          setCommentCounts(prev => ({
            ...prev,
            [variables.postId]: countData.count
          }));
          
          // Update the comment count in the post itself
          const updatedPosts = posts.map(post => {
            if (post.id === variables.postId) {
              return {
                ...post,
                commentCount: countData.count
              };
            }
            return post;
          });
          
          // Update the posts in the cache
          queryClient.setQueryData(['/api/learning-posts'], updatedPosts);
        }
      } catch (error) {
        console.error('Error fetching updated comment count:', error);
      }
      
      // Reset the new comment field
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
  
  // Mutation for liking a post
  const likePostMutation = useMutation({
    mutationFn: async (postId) => {
      if (!isAuthenticated) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to like posts",
          variant: "destructive",
        });
        return;
      }
      
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      const method = likedPosts[postId] ? 'DELETE' : 'POST';
      
      const response = await fetch(`/api/learning-posts/${postId}/like`, {
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
      
      // The API might return different formats, handle both possibilities
      return { 
        postId, 
        // If result.liked is defined, use it directly, otherwise infer from current state
        liked: result.liked !== undefined ? result.liked : !likedPosts[postId],
        count: result.count || 0 
      };
    },
    onSuccess: (data) => {
      if (data) {
        // Update liked state
        setLikedPosts(prev => ({
          ...prev,
          [data.postId]: data.liked
        }));
        
        // Update the likes count directly in the current posts data
        const updatedPosts = posts.map(post => {
          if (post.id === data.postId) {
            return {
              ...post,
              likes: data.count,
              likeCount: data.count // Update both properties for consistency
            };
          }
          return post;
        });
        
        // Update the posts in the cache
        queryClient.setQueryData(['/api/learning-posts'], updatedPosts);
        
        // Also invalidate the query to ensure fresh data on next fetch
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/learning-posts'] });
        }, 300);
        
        toast({
          description: data.liked ? "Post liked" : "Post unliked",
        });
      }
    },
    onError: (error) => {
      // Also invalidate the query on error to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/learning-posts'] });
      
      toast({
        title: "Error",
        description: error.message || "Failed to like post. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for bookmarking a post
  const bookmarkPostMutation = useMutation({
    mutationFn: async (postId) => {
      if (!isAuthenticated) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to bookmark posts",
          variant: "destructive",
        });
        return;
      }
      
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      const method = bookmarkedPosts[postId] ? 'DELETE' : 'POST';
      
      const response = await fetch(`/api/learning-posts/${postId}/bookmark`, {
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
      
      // The API might return different formats, handle both possibilities
      return { 
        postId, 
        // If result.bookmarked is defined, use it directly, otherwise infer from current state
        bookmarked: result.bookmarked !== undefined ? result.bookmarked : !bookmarkedPosts[postId],
        bookmarkId: result.bookmarkId 
      };
    },
    onSuccess: (data) => {
      if (data) {
        // Update bookmarked state
        setBookmarkedPosts(prev => ({
          ...prev,
          [data.postId]: data.bookmarked
        }));
        
        // Also invalidate the query to ensure fresh data on next fetch
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/learning-posts'] });
        }, 300);
        
        toast({
          description: data.bookmarked ? "Post saved to bookmarks" : "Post removed from bookmarks",
        });
      }
    },
    onError: (error) => {
      // Also invalidate the query on error to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/learning-posts'] });
      
      toast({
        title: "Error",
        description: error.message || "Failed to bookmark post. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for deleting a post
  const deletePostMutation = useMutation({
    mutationFn: async (postId) => {
      if (!isAuthenticated) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to delete posts",
          variant: "destructive",
        });
        return;
      }
      
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/learning-posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete post');
      }
      
      return { postId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning-posts'] });
      
      toast({
        description: "Post deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for deleting a comment
  const deleteCommentMutation = useMutation({
    mutationFn: async ({ commentId, postId }) => {
      if (!isAuthenticated) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to delete comments",
          variant: "destructive",
        });
        return;
      }
      
      // Get auth token from localStorage
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
      
      return { commentId, postId };
    },
    onSuccess: async (data) => {
      if (!data) return;
      
      // Invalidate the comments query for this post
      queryClient.invalidateQueries({ queryKey: ['/api/learning-posts', data.postId, 'comments'] });
      
      // Fetch the updated comment count
      try {
        const response = await fetch(`/api/learning-posts/${data.postId}/comments/count`);
        if (response.ok) {
          const countData = await response.json();
          
          // Update the comment count in our local state
          setCommentCounts(prev => ({
            ...prev,
            [data.postId]: countData.count
          }));
          
          // Update the comment count in the post itself
          const updatedPosts = posts.map(post => {
            if (post.id === data.postId) {
              return {
                ...post,
                commentCount: countData.count
              };
            }
            return post;
          });
          
          // Update the posts in the cache
          queryClient.setQueryData(['/api/learning-posts'], updatedPosts);
        }
      } catch (error) {
        console.error('Error fetching updated comment count:', error);
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
  
  // Handle showing/hiding the comment section for a post
  const toggleComments = (postId) => {
    setExpandedPostId(expandedPostId === postId ? null : postId);
    setNewComment('');
  };

  // Handle adding a new comment
  const handleAddComment = (postId) => {
    if (!newComment.trim() || !isAuthenticated) return;
    
    addCommentMutation.mutate({ postId, content: newComment });
  };
  
  // Handle new post submission
  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim() || !isAuthenticated) return;
    
    createPostMutation.mutate(newPost);
  };
  
  // Handle tag addition
  const handleAddTag = () => {
    if (!currentTag.trim() || newPost.tags.includes(currentTag)) return;
    setNewPost({
      ...newPost,
      tags: [...newPost.tags, currentTag]
    });
    setCurrentTag('');
  };
  
  // Handle tag removal
  const handleRemoveTag = (tag) => {
    setNewPost({
      ...newPost,
      tags: newPost.tags.filter(t => t !== tag)
    });
  };
  
  // Handle post type change
  const handleTypeChange = (value) => {
    setNewPost({
      ...newPost,
      type: value
    });
  };
  
  // Loading state
  if (isPostsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-center items-center py-10">
            <p>Loading posts...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Search function to check if post matches search query
  const postMatchesSearch = (post, query) => {
    if (!query) return true;
    
    const searchLower = query.toLowerCase();
    
    // Check title
    if (post.title && post.title.toLowerCase().includes(searchLower)) return true;
    
    // Check content
    if (post.content && post.content.toLowerCase().includes(searchLower)) return true;
    
    // Check tags
    if (post.tags && Array.isArray(post.tags)) {
      for (const tag of post.tags) {
        if (tag.toLowerCase().includes(searchLower)) return true;
      }
    }
    
    return false;
  };

  // Filter posts by type, tag, and search query
  const filteredPosts = posts.filter(post => {
    // Filter by post type
    if (activeTab !== 'all' && post.type !== activeTab) return false;
    
    // Filter by tag
    if (filterTag && filterTag !== 'all-tags' && Array.isArray(post.tags) && !post.tags.includes(filterTag)) return false;
    
    // Filter by search query
    if (!postMatchesSearch(post, searchQuery)) return false;
    
    return true;
  });

  return (
    <div>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Share & Connect</h1>
              <p className="text-gray-600 mt-2">Share your thoughts, discoveries, and learning resources</p>
            </div>
            
            {isAuthenticated ? (
              <Button 
                className="mt-4 md:mt-0 bg-orange-500 hover:bg-orange-600"
                onClick={() => setShowNewPostForm(true)}
              >
                <Plus size={18} className="mr-2" />
                Create Post
              </Button>
            ) : (
              <div className="mt-4 md:mt-0 text-sm bg-amber-50 border border-amber-300 rounded-md p-3">
                <p>Sign in to share your thoughts and resources</p>
              </div>
            )}
          </div>
          
          {/* Filter Controls */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto mb-4 md:mb-0">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="thought">Thoughts</TabsTrigger>
                  <TabsTrigger value="resource">Resources</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-gray-500" />
                <div className="w-[220px]">
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <Input 
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        placeholder="Search for a tag..." 
                        list="filter-tag-options"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && currentTag) {
                            setFilterTag(currentTag);
                            e.preventDefault();
                          }
                        }}
                      />
                      <datalist id="filter-tag-options">
                        <option value="all-tags">All tags</option>
                        {[...new Set([...tagOptions, ...availableTags])]
                          .sort()
                          .filter(tag => tag.toLowerCase().includes(currentTag.toLowerCase()))
                          .map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                          ))
                        }
                      </datalist>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (currentTag) {
                          setFilterTag(currentTag);
                        } else {
                          setFilterTag('all-tags');
                        }
                      }}
                    >
                      <Filter size={14} className="mr-1" />
                      Filter
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search by post title, content, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={16} />
                </Button>
              )}
            </div>
            
            {/* Show tags as filter badges */}
            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-sm text-gray-500 self-center mr-1">Popular tags:</span>
                {availableTags.slice(0, 8).map(tag => (
                  <Badge 
                    key={tag}
                    variant={filterTag === tag ? "default" : "outline"}
                    className="cursor-pointer hover:bg-orange-50"
                    onClick={() => filterTag === tag ? setFilterTag('all-tags') : setFilterTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {/* New Post Form (shown only when needed) */}
          {showNewPostForm && (
            <Card className="mb-8 border-orange-200 bg-orange-50">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Create New Post</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowNewPostForm(false)}
                  >
                    <X size={18} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Select value={newPost.type} onValueChange={handleTypeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select post type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="thought">
                          <div className="flex items-center">
                            <Lightbulb size={16} className="mr-2 text-amber-500" />
                            <span>Share a thought</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="resource">
                          <div className="flex items-center">
                            <BookOpen size={16} className="mr-2 text-blue-500" />
                            <span>Share a resource</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Input 
                      placeholder="Post title" 
                      value={newPost.title}
                      onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Textarea 
                      placeholder="What would you like to share?" 
                      rows={4}
                      value={newPost.content}
                      onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    />
                  </div>
                  
                  {newPost.type === 'resource' && (
                    <div>
                      <Input 
                        placeholder="Resource URL (optional)" 
                        value={newPost.resourceLink}
                        onChange={(e) => setNewPost({...newPost, resourceLink: e.target.value})}
                      />
                    </div>
                  )}
                  
                  <div>
                    <div className="text-sm font-medium mb-2">Tags</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newPost.tags.map(tag => (
                        <Badge 
                          key={tag} 
                          variant="secondary"
                          className="cursor-pointer"
                        >
                          {tag}
                          <X 
                            size={14} 
                            className="ml-1" 
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Input 
                          value={currentTag}
                          onChange={(e) => setCurrentTag(e.target.value)}
                          placeholder="Create or search for a tag" 
                          list="tag-options"
                        />
                        <datalist id="tag-options">
                          {tagOptions
                            .filter(tag => !newPost.tags.includes(tag) && 
                                         tag.toLowerCase().includes(currentTag.toLowerCase()))
                            .map(tag => (
                              <option key={tag} value={tag}>{tag}</option>
                            ))
                          }
                        </datalist>
                      </div>
                      <Button variant="outline" onClick={handleAddTag}>
                        <Tag size={16} className="mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 border-t pt-4">
                <Button variant="outline" onClick={() => setShowNewPostForm(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={handleCreatePost}
                >
                  Publish
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Posts */}
          <div className="space-y-6">
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <div key={post.id} className="space-y-4">
                  <Card className="cursor-pointer group overflow-hidden hover:shadow-lg transition-all duration-300 border border-transparent hover:border-orange-200">
                    {/* Animated gradient top bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-orange-300 via-orange-500 to-amber-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    
                    <div onClick={() => navigate(`/post/${post.id}`)} className="relative">
                      <CardHeader className="pb-3 transition-colors duration-300 group-hover:bg-orange-50/50">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-4">
                            <Avatar className="border-2 border-orange-100 transition-all duration-300 group-hover:border-orange-300 group-hover:shadow-md">
                              <AvatarFallback className="bg-orange-100 text-orange-800 font-semibold transition-colors duration-300 group-hover:bg-orange-200">
                                {post.user?.username?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg transition-colors duration-300 group-hover:text-orange-700">{post.title}</CardTitle>
                              <CardDescription className="flex items-center mt-1">
                                <span className="font-medium">{post.user?.username || 'Anonymous'}</span>
                                <span className="inline-block mx-2">•</span>
                                <Calendar size={14} className="mr-1 opacity-70" />
                                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Badge 
                              variant={post.type === 'thought' ? 'secondary' : 'outline'} 
                              className="transition-all duration-300 group-hover:shadow-sm"
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
                        <p className="text-gray-700 whitespace-pre-line line-clamp-3 transition-colors duration-300 group-hover:text-gray-900">{post.content}</p>
                        
                        {post.type === 'resource' && post.resourceLink && (
                          <a 
                            href={post.resourceLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center mt-3 text-blue-600 hover:text-blue-800 underline transform transition-all duration-300 hover:translate-x-1"
                            onClick={(e) => e.stopPropagation()} // Prevent navigating to post detail
                          >
                            View Resource <ArrowRight size={16} className="ml-1" />
                          </a>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mt-4">
                          {post.tags.map(tag => (
                            <Badge 
                              key={tag} 
                              variant="outline"
                              className="cursor-pointer transition-all duration-300 hover:bg-orange-100 hover:text-orange-800 hover:scale-105"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent navigating to post detail
                                filterTag === tag ? setFilterTag('all-tags') : setFilterTag(tag);
                              }}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </div>
                    <CardFooter className="border-t pt-4 flex flex-wrap items-center gap-4 justify-between bg-gray-50 group-hover:bg-orange-50 transition-colors duration-300">
                      <div className="flex flex-wrap items-center gap-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`${likedPosts[post.id] ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-all duration-300 hover:scale-110`}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent navigating to post detail
                            likePostMutation.mutate(post.id);
                          }}
                        >
                          <Heart size={18} className={`mr-1 transform transition-transform duration-300 ${likedPosts[post.id] ? 'scale-110' : ''}`} fill={likedPosts[post.id] ? 'currentColor' : 'none'} />
                          {post.likeCount || post.likes || 0}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-500 hover:text-amber-500 transition-all duration-300 hover:scale-110"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent navigating to post detail
                            toggleComments(post.id);
                          }}
                        >
                          <MessageSquare size={18} className="mr-1" />
                          {post.commentCount || commentCounts[post.id] || 0}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-500 hover:text-green-500 transition-all duration-300 hover:scale-110"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent navigating to post detail
                            if (navigator.share) {
                              navigator.share({
                                title: post.title,
                                text: post.content.substring(0, 100) + '...',
                                url: window.location.href
                              }).catch(err => console.error('Share failed:', err));
                            } else {
                              navigator.clipboard.writeText(window.location.href);
                              toast({
                                description: "Link copied to clipboard"
                              });
                            }
                          }}
                        >
                          <Share2 size={18} className="mr-1" />
                          Share
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`${bookmarkedPosts[post.id] ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-500 transition-all duration-300 hover:scale-110`}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent navigating to post detail
                            bookmarkPostMutation.mutate(post.id);
                          }}
                        >
                          {bookmarkedPosts[post.id] ? (
                            <Bookmark size={18} className="mr-1 transform scale-110" fill="currentColor" />
                          ) : (
                            <BookmarkPlus size={18} className="mr-1" />
                          )}
                          Save
                        </Button>
                      </div>
                      <div>
                        {isAuthenticated && user?.id === post.userId && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-9 w-9 p-0 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300 hover:scale-110"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent navigating to post detail
                              if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
                                deletePostMutation.mutate(post.id);
                              }
                            }}
                          >
                            <Trash size={16} />
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                  
                  {/* Comments Section (expanded when activePostId matches) */}
                  {expandedPostId === post.id && (
                    <Card className="border-l-4 border-l-amber-400 ml-8">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-600">Comments</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Comment fetching logic now handled at component level */}
                        {expandedPostId === post.id && (
                          <>
                            {isCommentsLoading ? (
                              <div className="flex justify-center py-4">
                                <p className="text-center text-gray-500 text-sm">Loading comments...</p>
                              </div>
                            ) : commentsData[post.id]?.length > 0 ? (
                              commentsData[post.id].map(comment => (
                                <div key={comment.id} className="flex space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs bg-gray-100">
                                      {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium text-sm">
                                          {comment.user?.username || 'Anonymous'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-500">
                                            {new Date(comment.createdAt).toLocaleDateString()}
                                          </span>
                                          {isAuthenticated && (user?.id === comment.userId) && (
                                            <Dialog>
                                              <DialogTrigger asChild>
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon"
                                                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-transparent"
                                                >
                                                  <Trash size={14} />
                                                </Button>
                                              </DialogTrigger>
                                              <DialogContent>
                                                <DialogHeader>
                                                  <DialogTitle>Delete Comment?</DialogTitle>
                                                  <DialogDescription>
                                                    This action cannot be undone. This will permanently delete your comment.
                                                  </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter>
                                                  <Button 
                                                    variant="outline" 
                                                    onClick={() => {
                                                      const closeBtn = document.querySelector('[data-radix-collection-item]');
                                                      if (closeBtn) closeBtn.click();
                                                    }}
                                                  >
                                                    Cancel
                                                  </Button>
                                                  <Button 
                                                    variant="destructive"
                                                    onClick={() => {
                                                      deleteCommentMutation.mutate({
                                                        commentId: comment.id,
                                                        postId: post.id
                                                      });
                                                      const closeBtn = document.querySelector('[data-radix-collection-item]');
                                                      if (closeBtn) closeBtn.click();
                                                    }}
                                                  >
                                                    Delete
                                                  </Button>
                                                </DialogFooter>
                                              </DialogContent>
                                            </Dialog>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-700">{comment.content}</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center text-gray-500 text-sm py-4">
                                No comments yet. Be the first to comment!
                              </p>
                            )}
                          </>
                        )}
                        
                        {/* Add new comment */}
                        {isAuthenticated && (
                          <div className="flex items-start space-x-3 pt-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex space-x-2">
                              <Textarea 
                                placeholder="Add a comment..." 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="text-sm min-h-[60px]"
                              />
                              <Button 
                                size="sm" 
                                className="self-end bg-orange-500 hover:bg-orange-600"
                                onClick={() => handleAddComment(post.id)}
                                disabled={!newComment.trim()}
                              >
                                <Send size={16} />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No posts found</h3>
                <p className="text-gray-500">
                  {filterTag && filterTag !== 'all-tags' ? `No posts with the tag "${filterTag}"` : 'Be the first to post in this category'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}