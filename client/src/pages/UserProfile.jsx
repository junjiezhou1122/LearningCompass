import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  UserCircle,
  Calendar,
  MessageSquare,
  Heart,
  Users,
  Plus,
  Bookmark,
  Eye,
  ArrowLeft,
  ArrowRight,
  Clock,
  BookOpen,
  Activity,
  Loader2
} from 'lucide-react';

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState('posts');
  const params = useParams();
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  
  const userId = parseInt(params.userId);
  
  // Check if user ID is valid
  if (isNaN(userId)) {
    navigate('/');
    return null;
  }
  
  // Fetch user data
  const { data: profileUser, isLoading: isLoadingUser, error: userError } = useQuery({
    queryKey: [`/api/users/${userId}`],
    staleTime: 10000, // 10 seconds
  });
  
  // Fetch user's posts
  const { data: userPosts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: [`/api/users/${userId}/posts`],
    staleTime: 5000, // 5 seconds
  });
  
  // Fetch followers count
  const { data: followersData, isLoading: isLoadingFollowers } = useQuery({
    queryKey: [`/api/users/${userId}/followers/count`],
    staleTime: 5000, // 5 seconds
  });
  
  // Fetch following count
  const { data: followingData, isLoading: isLoadingFollowing } = useQuery({
    queryKey: [`/api/users/${userId}/following/count`],
    staleTime: 5000, // 5 seconds
  });
  
  // Check if current user is following this user
  const { data: followingStatusData, isLoading: isLoadingFollowingStatus } = useQuery({
    queryKey: [`/api/users/${userId}/following/${userId}`],
    enabled: isAuthenticated && user?.id !== userId,
    retry: false,
    staleTime: 5000, // 5 seconds
  });
  
  // Mutation to follow a user
  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to follow user');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/followers/count`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/following/${userId}`] });
      
      toast({
        title: "Success!",
        description: `You are now following ${profileUser?.username}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to follow user. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation to unfollow a user
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unfollow user');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/followers/count`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/following/${userId}`] });
      
      toast({
        title: "Success!",
        description: `You are no longer following ${profileUser?.username}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow user. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle follow/unfollow
  const handleFollowToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to follow users",
        variant: "destructive",
      });
      return;
    }
    
    if (followingStatusData?.following) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };
  
  // Format date helper
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  // Render loading state
  if (isLoadingUser) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col space-y-4">
          <div className="flex items-start space-x-4 md:space-x-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64 mb-4" />
              <div className="flex space-x-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-28" />
              </div>
            </div>
          </div>
          
          <Skeleton className="h-12 w-full mt-6" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (userError) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <Activity className="mr-2 h-5 w-5" />
              Error Loading Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              We encountered a problem loading this profile. The user may not exist or there was a server error.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/')} className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Homepage
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* User profile header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-24"></div>
        <div className="px-6 py-4 relative">
          <div className="flex flex-col md:flex-row md:items-center">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg absolute -mt-16">
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-600 text-white text-xl font-bold">
                {profileUser?.username?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="mt-12 md:mt-0 md:ml-28">
              <h1 className="text-2xl font-bold text-gray-900">{profileUser?.username}</h1>
              <p className="text-gray-600 flex items-center mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                Joined {profileUser?.createdAt ? formatDate(profileUser.createdAt) : 'Unknown'}
              </p>
              
              <div className="flex items-center space-x-4 mt-3">
                <div className="flex items-center text-gray-700">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="font-medium">
                    {followersData?.count || 0} {followersData?.count === 1 ? 'Follower' : 'Followers'}
                  </span>
                </div>
                <div className="flex items-center text-gray-700">
                  <UserCircle className="h-4 w-4 mr-1" />
                  <span className="font-medium">
                    {followingData?.count || 0} Following
                  </span>
                </div>
                <div className="flex items-center text-gray-700">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <span className="font-medium">
                    {userPosts.length} {userPosts.length === 1 ? 'Post' : 'Posts'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 md:ml-auto">
              {isAuthenticated && user?.id !== userId && (
                <Button 
                  onClick={handleFollowToggle}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  variant={followingStatusData?.following ? "outline" : "default"}
                  className={`flex items-center transition-all ${
                    followingStatusData?.following ? 
                    "border-orange-400 text-orange-600 hover:bg-orange-50" : 
                    "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                  }`}
                >
                  {(followMutation.isPending || unfollowMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : followingStatusData?.following ? (
                    <UserCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  
                  {followingStatusData?.following ? "Following" : "Follow"}
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                className="ml-2 text-gray-500 hover:text-gray-700" 
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs for Posts, Following, Followers */}
      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-orange-50 p-1">
            <TabsTrigger 
              value="posts"
              className="data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger 
              value="likes"
              className="data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm"
            >
              <Heart className="h-4 w-4 mr-2" />
              Likes
            </TabsTrigger>
            <TabsTrigger 
              value="bookmarks"
              className="data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm"
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmarks
            </TabsTrigger>
          </TabsList>
          
          {/* Posts tab content */}
          <TabsContent value="posts" className="mt-4">
            {isLoadingPosts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-0">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent className="pt-4">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-8 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : userPosts.length === 0 ? (
              <Card className="text-center p-8 bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-gray-500">No Posts Yet</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">
                    This user hasn't published any posts yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userPosts.map(post => (
                  <Card key={post.id} className="overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-orange-200 group cursor-pointer"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    <CardHeader className="pb-0 transition-colors duration-300 group-hover:bg-orange-50/50">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg transition-colors duration-300 group-hover:text-orange-700">
                          {post.title}
                        </CardTitle>
                        <Badge variant={post.type === 'thought' ? 'outline' : 'secondary'} className="ml-2 capitalize">
                          {post.type === 'thought' ? 
                            <MessageSquare className="h-3 w-3 mr-1" /> : 
                            <BookOpen className="h-3 w-3 mr-1" />
                          }
                          {post.type}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(post.createdAt)}
                        
                        <span className="mx-2">•</span>
                        
                        <Eye className="h-3 w-3 mr-1" />
                        {post.views} {post.views === 1 ? 'view' : 'views'}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-2">
                      <p className="text-gray-600 line-clamp-2 mb-2">{post.content}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.tags && post.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="border-t border-gray-100 bg-gray-50 px-4 py-2 transition-colors duration-300 group-hover:bg-orange-50/30">
                      <div className="flex justify-between w-full text-sm text-gray-500">
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-1 text-red-500" />
                          <span>{post.likes || 0}</span>
                          <MessageSquare className="h-4 w-4 ml-3 mr-1 text-blue-500" />
                          <span>{post.commentCount || 0}</span>
                        </div>
                        <div className="flex items-center text-orange-600 font-medium">
                          Read more
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Likes tab content */}
          <TabsContent value="likes" className="mt-4">
            <Card className="text-center p-8 bg-gray-50">
              <CardHeader>
                <CardTitle className="text-gray-500">Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  The ability to view liked posts will be available soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Bookmarks tab content */}
          <TabsContent value="bookmarks" className="mt-4">
            <Card className="text-center p-8 bg-gray-50">
              <CardHeader>
                <CardTitle className="text-gray-500">Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  The ability to view bookmarked posts will be available soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}