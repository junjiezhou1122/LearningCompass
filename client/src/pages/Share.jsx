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
  Trash
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
  
  // Fetch all learning posts
  const { data: posts = [], isLoading: isPostsLoading } = useQuery({
    queryKey: ['/api/learning-posts'],
    staleTime: 1000 * 60, // 1 minute
    onSuccess: (posts) => {
      // For each post, fetch comment counts and like counts
      if (posts && posts.length > 0) {
        fetchCommentCounts(posts);
        fetchLikeCounts(posts);
        if (isAuthenticated) {
          checkLikedAndBookmarkedPosts(posts);
        }
      }
    }
  });
  
  // Fetch comment counts for posts
  const fetchCommentCounts = async (posts) => {
    const commentCountsObj = {};
    
    for (const post of posts) {
      try {
        const response = await fetch(`/api/learning-posts/${post.id}/comments/count`);
        if (response.ok) {
          const data = await response.json();
          commentCountsObj[post.id] = data.count;
          
          // Update the post object directly to ensure it has the latest count
          post.commentCount = data.count;
        }
      } catch (error) {
        console.error(`Error fetching comment count for post ${post.id}:`, error);
        commentCountsObj[post.id] = 0;
        post.commentCount = 0;
      }
    }
    
    setCommentCounts(commentCountsObj);
  };
  
  // Fetch like counts for posts
  const fetchLikeCounts = async (posts) => {
    for (const post of posts) {
      try {
        const response = await fetch(`/api/learning-posts/${post.id}/like/count`);
        if (response.ok) {
          const data = await response.json();
          // Update the post object directly to ensure it has the latest count
          post.likeCount = data.count || 0;
        }
      } catch (error) {
        console.error(`Error fetching like count for post ${post.id}:`, error);
        post.likeCount = 0;
      }
    }
  };
  
  // Check which posts the user has liked and bookmarked
  const checkLikedAndBookmarkedPosts = async (posts) => {
    if (!isAuthenticated) return;
    
    const token = localStorage.getItem('token');
    const likedObj = {};
    const bookmarkedObj = {};
    
    for (const post of posts) {
      try {
        // Check likes
        const likeResponse = await fetch(`/api/learning-posts/${post.id}/like`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (likeResponse.ok) {
          const likeData = await likeResponse.json();
          likedObj[post.id] = !!likeData;
          
          // Fetch current likes count for the post
          const likesCountResponse = await fetch(`/api/learning-posts/${post.id}/likes-count`);
          
          if (likesCountResponse.ok) {
            const likesCountData = await likesCountResponse.json();
            post.likes = likesCountData.count || 0;
          }
        }
        
        // Check bookmarks
        const bookmarkResponse = await fetch(`/api/learning-posts/${post.id}/bookmark`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (bookmarkResponse.ok) {
          const bookmarkData = await bookmarkResponse.json();
          bookmarkedObj[post.id] = !!bookmarkData;
        }
      } catch (error) {
        console.error(`Error checking status for post ${post.id}:`, error);
      }
    }
    
    setLikedPosts(likedObj);
    setBookmarkedPosts(bookmarkedObj);
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
    staleTime: 1000 * 60, // 1 minute
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
      return { 
        postId, 
        liked: !likedPosts[postId],
        count: result.count || 0 
      };
    },
    onSuccess: (data) => {
      if (data) {
        setLikedPosts(prev => ({
          ...prev,
          [data.postId]: data.liked
        }));
        
        // Update the likes count directly in the current posts data
        const updatedPosts = posts.map(post => {
          if (post.id === data.postId) {
            return {
              ...post,
              likes: data.count
            };
          }
          return post;
        });
        
        // Update the posts in the cache
        queryClient.setQueryData(['/api/learning-posts'], updatedPosts);
        
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
      return { 
        postId, 
        bookmarked: !bookmarkedPosts[postId],
        bookmarkId: result.bookmarkId 
      };
    },
    onSuccess: (data) => {
      if (data) {
        setBookmarkedPosts(prev => ({
          ...prev,
          [data.postId]: data.bookmarked
        }));
        
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
  
  // Filter posts by type and tag
  const filteredPosts = posts.filter(post => {
    if (activeTab !== 'all' && post.type !== activeTab) return false;
    if (filterTag && filterTag !== 'all-tags' && Array.isArray(post.tags) && !post.tags.includes(filterTag)) return false;
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
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 bg-gray-50 p-4 rounded-lg">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto mb-4 md:mb-0">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="thought">Thoughts</TabsTrigger>
                <TabsTrigger value="resource">Resources</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-tags">All tags</SelectItem>
                  {tagOptions.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-4">
                          <Avatar>
                            <AvatarFallback className="bg-orange-100 text-orange-800">
                              {post.user?.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{post.title}</CardTitle>
                            <CardDescription className="flex items-center mt-1">
                              <span>{post.user?.username || 'Anonymous'}</span>
                              <span className="inline-block mx-2">•</span>
                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">

                          <Badge variant={post.type === 'thought' ? 'secondary' : 'outline'}>
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
                      <p className="text-gray-700 whitespace-pre-line">{post.content}</p>
                      
                      {post.type === 'resource' && post.resourceLink && (
                        <a 
                          href={post.resourceLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block mt-3 text-blue-600 hover:text-blue-800 underline"
                        >
                          View Resource →
                        </a>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        {post.tags.map(tag => (
                          <Badge 
                            key={tag} 
                            variant="outline"
                            className="cursor-pointer hover:bg-orange-50"
                            onClick={() => filterTag === tag ? setFilterTag('all-tags') : setFilterTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4 flex flex-wrap items-center gap-4 justify-between">
                      <div className="flex flex-wrap items-center gap-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`${likedPosts[post.id] ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
                          onClick={() => likePostMutation.mutate(post.id)}
                        >
                          <Heart size={18} className="mr-1" fill={likedPosts[post.id] ? 'currentColor' : 'none'} />
                          {post.likeCount || post.likes || 0}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-500 hover:text-amber-500"
                          onClick={() => toggleComments(post.id)}
                        >
                          <MessageSquare size={18} className="mr-1" />
                          {post.commentCount || commentCounts[post.id] || 0}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-500 hover:text-green-500"
                          onClick={() => {
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
                          className={`${bookmarkedPosts[post.id] ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-500`}
                          onClick={() => bookmarkPostMutation.mutate(post.id)}
                        >
                          {bookmarkedPosts[post.id] ? (
                            <Bookmark size={18} className="mr-1" fill="currentColor" />
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
                            className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100"
                            onClick={() => {
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
                                        <span className="text-xs text-gray-500">
                                          {new Date(comment.createdAt).toLocaleDateString()}
                                        </span>
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