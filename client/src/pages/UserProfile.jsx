import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useLocation, useRoute } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Heart, 
  Bookmark, 
  Calendar, 
  UserPlus, 
  UserMinus, 
  User, 
  UserCheck, 
  Loader2, 
  Lightbulb, 
  BookOpen, 
  ArrowRight,
  Eye
} from 'lucide-react';

export default function UserProfile() {
  const { userId } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useLocation()[1];
  const [activeTab, setActiveTab] = useState('posts');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch user profile data
  const { 
    data: profileData, 
    isLoading: isProfileLoading,
    error: profileError
  } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });
  
  // Fetch user posts
  const { 
    data: userPosts, 
    isLoading: isPostsLoading 
  } = useQuery({
    queryKey: [`/api/users/${userId}/posts`],
    enabled: !!userId,
  });

  // Fetch followers count
  const { 
    data: followersCountData,
    isLoading: isFollowersCountLoading 
  } = useQuery({
    queryKey: [`/api/users/${userId}/followers/count`],
    enabled: !!userId,
  });
  // Extract the actual count value from the response
  const followersCount = followersCountData?.count || 0;

  // Fetch following count
  const { 
    data: followingCountData,
    isLoading: isFollowingCountLoading 
  } = useQuery({
    queryKey: [`/api/users/${userId}/following/count`],
    enabled: !!userId,
  });
  // Extract the actual count value from the response
  const followingCount = followingCountData?.count || 0;

  // Check if the current user is following this profile
  const { 
    data: isFollowingData,
    isLoading: isFollowingStatusLoading 
  } = useQuery({
    queryKey: [`/api/users/${userId}/following/${currentUser?.id}`],
    enabled: !!userId && !!currentUser && currentUser.id !== parseInt(userId),
  });
  // Extract the actual boolean value from the response
  const isFollowing = isFollowingData?.isFollowing || false;

  // Follow user mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to follow user');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/followers/count`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/following/${currentUser?.id}`] });
      
      toast({
        title: "Success",
        description: `You are now following ${profileData?.username}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unfollow user mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unfollow user');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/followers/count`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/following/${currentUser?.id}`] });
      
      toast({
        title: "Success",
        description: `You have unfollowed ${profileData?.username}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle follow/unfollow button click
  const handleFollowToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to follow users",
        variant: "destructive",
      });
      return;
    }
    
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  if (isProfileLoading) {
    return (
      <div className="container max-w-5xl py-12 mx-auto px-4">
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  if (profileError || !profileData) {
    return (
      <div className="container max-w-5xl py-12 mx-auto px-4">
        <div className="text-center py-12">
          <User className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h1>
          <p className="text-gray-500 mb-6">The user you're looking for doesn't exist or has been removed.</p>
          <Button 
            onClick={() => navigate('/')}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 mx-auto px-4">
      {/* Profile Header */}
      <Card className="mb-8 overflow-hidden border-none shadow-md bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-orange-300 via-orange-400 to-amber-300 opacity-70"></div>
        
        <CardHeader className="pt-16 pb-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-orange-100 text-orange-800 text-4xl font-bold">
                {profileData.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center sm:text-left">
              <CardTitle className="text-2xl font-bold mb-1">{profileData.username}</CardTitle>
              <CardDescription className="text-gray-600 mb-4">
                {profileData.bio || 'Learning enthusiast sharing knowledge and insights'}
              </CardDescription>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-2">
                <div className="flex items-center gap-1 text-gray-600">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{userPosts?.length || 0} posts</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <UserCheck className="h-4 w-4 text-gray-500" />
                  <span>{followersCount || 0} followers</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <UserPlus className="h-4 w-4 text-gray-500" />
                  <span>{followingCount || 0} following</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Joined {new Date(profileData.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            {isAuthenticated && currentUser?.id !== parseInt(userId) && (
              <div className="mt-4 sm:mt-0">
                <Button 
                  variant={isFollowing ? "outline" : "default"}
                  className={isFollowing ? 
                    "border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800" : 
                    "bg-orange-500 hover:bg-orange-600 text-white"
                  }
                  onClick={handleFollowToggle}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                >
                  {followMutation.isPending || unfollowMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : isFollowing ? (
                    <UserMinus className="h-4 w-4 mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>
      
      {/* Profile Content */}
      <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-6 bg-orange-50">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Posts</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="py-4">
          {isPostsLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : userPosts?.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {userPosts.map(post => (
                <Card key={post.id} className="overflow-hidden transition-all duration-300 hover:shadow-md group">
                  <div onClick={() => navigate(`/post/${post.id}`)} className="cursor-pointer">
                    <CardHeader className="pb-3 transition-colors duration-300 group-hover:bg-orange-50/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg transition-colors duration-300 group-hover:text-orange-700">{post.title}</CardTitle>
                          <CardDescription className="flex flex-wrap items-center mt-1 gap-x-2">
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
                          className="inline-flex items-center mt-3 text-blue-600 hover:text-blue-800 hover:underline transform transition-all duration-300 hover:translate-x-1"
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
                            className="transition-all duration-300 hover:bg-orange-100 hover:text-orange-800"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </div>
                  
                  <CardFooter className="border-t pt-4 flex flex-wrap items-center justify-between gap-4 bg-gray-50 group-hover:bg-orange-50 transition-colors duration-300">
                    <div className="flex flex-wrap items-center gap-4">
                      <PostLikeStatus postId={post.id} />
                      <PostCommentCount postId={post.id} />
                      <div className="flex items-center gap-1 text-gray-500">
                        <Eye size={16} className="text-blue-400" />
                        <span>{post.views || 0}</span>
                      </div>
                      <PostBookmarkStatus postId={post.id} />
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No posts yet</h3>
              <p className="text-gray-500">
                {parseInt(userId) === currentUser?.id ? 
                  "You haven't shared any posts yet. Start sharing your learning journey!" : 
                  `${profileData.username} hasn't shared any posts yet.`}
              </p>
              
              {parseInt(userId) === currentUser?.id && (
                <Button 
                  className="mt-6 bg-orange-500 hover:bg-orange-600"
                  onClick={() => navigate('/share')}
                >
                  Create Your First Post
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component to show post like status and count
function PostLikeStatus({ postId }) {
  const { data: likeData } = useQuery({
    queryKey: [`/api/learning-posts/${postId}/like`],
    enabled: !!postId,
  });

  return (
    <div className="flex items-center gap-1 text-gray-500">
      <Heart 
        size={16} 
        className={likeData?.liked ? "text-red-500" : ""} 
        fill={likeData?.liked ? "currentColor" : "none"} 
      />
      <span>{likeData?.count || 0}</span>
    </div>
  );
}

// Component to show post comment count
function PostCommentCount({ postId }) {
  const { data: commentData } = useQuery({
    queryKey: [`/api/learning-posts/${postId}/comments/count`],
    enabled: !!postId,
  });

  return (
    <div className="flex items-center gap-1 text-gray-500">
      <MessageSquare size={16} className="text-orange-500" />
      <span>{commentData?.count || 0}</span>
    </div>
  );
}

// Component to show post bookmark status
function PostBookmarkStatus({ postId }) {
  const { isAuthenticated } = useAuth();
  const { data: bookmarkData } = useQuery({
    queryKey: [`/api/learning-posts/${postId}/bookmark`],
    enabled: !!postId && isAuthenticated,
  });

  return (
    <div className="flex items-center gap-1 text-gray-500">
      <Bookmark 
        size={16} 
        className={bookmarkData?.bookmarked ? "text-yellow-500" : ""} 
        fill={bookmarkData?.bookmarked ? "currentColor" : "none"} 
      />
    </div>
  );
}