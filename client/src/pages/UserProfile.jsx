import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ChatButton from "../components/chat/ChatButton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  Eye,
  LogOut,
  Lock,
  Settings,
} from "lucide-react";

// Component to show post like status and count
function PostLikeStatus({ postId }) {
  const { isAuthenticated } = useAuth();
  const { data: likeData } = useQuery({
    queryKey: [`/api/learning-posts/${postId}/like`],
    enabled: !!postId && isAuthenticated,
  });

  // Get post likes count separately - this endpoint doesn't require authentication
  const { data: likesCountData } = useQuery({
    queryKey: [`/api/learning-posts/${postId}/like/count`],
    enabled: !!postId,
  });

  // First check for likes count from the dedicated endpoint, fallback to auth endpoint data
  const likeCount = likesCountData?.count ?? likeData?.count ?? 0;

  return (
    <div className="flex items-center gap-1 text-gray-500">
      <Heart
        size={16}
        className={likeData?.liked ? "text-red-500" : ""}
        fill={likeData?.liked ? "currentColor" : "none"}
      />
      <span>{likeCount}</span>
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

export default function UserProfile() {
  const { userId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser, isAuthenticated, logout } = useAuth();

  // Debug logs to see what parameters we're working with
  useEffect(() => {
    console.log("UserProfile params:", { userId });
    console.log("Current user:", currentUser);
  }, [userId, currentUser]);

  // Determine if this is a personal profile or public profile
  const isPersonalProfile =
    isAuthenticated && (!userId || String(userId) === String(currentUser?.id));

  // State for UI
  const [activeTab, setActiveTab] = useState("posts");
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [modalType, setModalType] = useState("followers");
  const [modalUsers, setModalUsers] = useState([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [userLikes, setUserLikes] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [isLikesLoading, setIsLikesLoading] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Get user profile data - make sure we're always using a valid userId
  const effectiveUserId =
    userId || (currentUser?.id ? String(currentUser.id) : null);

  const {
    data: profileData,
    isLoading: isProfileLoading,
    error: profileError,
  } = useQuery({
    queryKey: [`/api/users/${effectiveUserId}`],
    queryFn: async () => {
      if (!effectiveUserId) {
        throw new Error("No user ID available");
      }
      console.log(`Fetching profile for user ID: ${effectiveUserId}`);
      const response = await fetch(`/api/users/${effectiveUserId}`);
      if (!response.ok) {
        throw new Error(`Error fetching user profile: ${response.statusText}`);
      }
      return await response.json();
    },
    enabled: !!effectiveUserId, // Only run when we have a valid userId
  });

  // Get user posts with the validated ID
  const { data: userPosts = [], isLoading: isPostsLoading } = useQuery({
    queryKey: [`/api/users/${effectiveUserId}/posts`],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      console.log(`Fetching posts for user ID: ${effectiveUserId}`);
      const response = await fetch(`/api/users/${effectiveUserId}/posts`);
      if (!response.ok) {
        throw new Error(`Error fetching user posts: ${response.statusText}`);
      }
      return await response.json();
    },
    enabled: !!effectiveUserId,
  });

  // Get followers count
  const { data: followersCountData, isLoading: isFollowersCountLoading } =
    useQuery({
      queryKey: [`/api/users/${effectiveUserId}/followers/count`],
      queryFn: async () => {
        if (!effectiveUserId) return { count: 0 };
        console.log(`Fetching followers count for user ID: ${effectiveUserId}`);
        const response = await fetch(
          `/api/users/${effectiveUserId}/followers/count`
        );
        if (!response.ok) {
          console.error(
            `Error fetching followers count: ${response.statusText}`
          );
          return { count: 0 };
        }
        return await response.json();
      },
      enabled: !!effectiveUserId,
    });
  // Extract the actual count value from the response
  const followersCount = followersCountData?.count || 0;

  // Get following count
  const { data: followingCountData, isLoading: isFollowingCountLoading } =
    useQuery({
      queryKey: [`/api/users/${effectiveUserId}/following/count`],
      queryFn: async () => {
        if (!effectiveUserId) return { count: 0 };
        console.log(`Fetching following count for user ID: ${effectiveUserId}`);
        const response = await fetch(
          `/api/users/${effectiveUserId}/following/count`
        );
        if (!response.ok) {
          console.error(
            `Error fetching following count: ${response.statusText}`
          );
          return { count: 0 };
        }
        return await response.json();
      },
      enabled: !!effectiveUserId,
    });
  // Extract the actual count value from the response
  const followingCount = followingCountData?.count || 0;

  // State to manage follow status
  const [followStatus, setFollowStatus] = useState({
    isFollowing: false,
    isLoading: true,
    error: null,
  });

  // Get current follow status with a proper query
  const {
    data: followData,
    error: followError,
    isPending: isFollowCheckPending,
  } = useQuery({
    queryKey: [`/api/users/${userId}/following/${currentUser?.id}`],
    queryFn: async () => {
      if (!userId || !currentUser?.id || String(userId) === String(currentUser.id)) {
        return { following: false };
      }
      console.log(
        `Checking follow status: currentUser ${currentUser.id} following userId ${userId}`
      );
      try {
        const response = await fetch(
          `/api/users/${userId}/following/${currentUser.id}`
        );
        if (!response.ok) {
          console.error(`Error checking follow status: ${response.statusText}`);
          return { following: false };
        }
        const data = await response.json();
        console.log("Follow status response:", data);
        return data;
      } catch (error) {
        console.error("Follow status check error:", error);
        return { following: false };
      }
    },
    enabled:
      !!userId && !!currentUser?.id && String(userId) !== String(currentUser.id),
    refetchInterval: false,
    refetchOnWindowFocus: true, // Re-check when window gets focus
    refetchOnMount: true, // Re-check when component mounts
    retry: 3,
    staleTime: 0, // Consider data stale immediately so it will refetch
  });

  // Update follow status when data changes
  useEffect(() => {
    // If we're checking, keep previous state but mark as loading
    if (isFollowCheckPending) {
      setFollowStatus((prev) => ({
        ...prev,
        isLoading: true,
      }));
      return;
    }

    // If not authenticated or own profile, reset to not following
    if (
      !isAuthenticated ||
      !currentUser ||
      String(currentUser.id) === String(userId)
    ) {
      setFollowStatus({
        isFollowing: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Update based on query results
    if (followData) {
      setFollowStatus({
        isFollowing: !!followData.following,
        isLoading: false,
        error: null,
      });
    } else if (followError) {
      setFollowStatus({
        isFollowing: false,
        isLoading: false,
        error: "Failed to check follow status",
      });
    }
  }, [
    followData,
    followError,
    isFollowCheckPending,
    userId,
    currentUser,
    isAuthenticated,
  ]);

  // Follow user function
  const followUser = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to follow users",
        variant: "destructive",
      });
      return;
    }

    // Optimistic UI update
    setFollowStatus((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        // Update related queries
        queryClient.invalidateQueries({
          queryKey: [`/api/users/${userId}/followers/count`],
        });
        queryClient.invalidateQueries({
          queryKey: [`/api/users/${userId}/following/${currentUser?.id}`],
        });
        // Force update the cache
        queryClient.setQueryData(
          [`/api/users/${userId}/following/${currentUser?.id}`],
          { following: true }
        );

        setFollowStatus({
          isFollowing: true,
          isLoading: false,
          error: null,
        });

        toast({
          title: "Success",
          description: `You are now following ${profileData?.username}`,
        });
      } else {
        const errorData = await response.json();

        // If already following, just update the UI state (don't show error)
        if (errorData.message?.includes("Already following")) {
          setFollowStatus({
            isFollowing: true,
            isLoading: false,
            error: null,
          });
        } else {
          setFollowStatus((prev) => ({
            ...prev,
            isLoading: false,
            error: errorData.message || "Failed to follow user",
          }));

          toast({
            title: "Error",
            description: errorData.message || "Failed to follow user",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error following user:", error);
      setFollowStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to follow user",
      }));

      toast({
        title: "Error",
        description: error.message || "Failed to follow user",
        variant: "destructive",
      });
    }
  };

  // Unfollow user function
  const unfollowUser = async () => {
    if (!isAuthenticated) {
      return;
    }

    // Optimistic UI update
    setFollowStatus((prev) => ({ ...prev, isLoading: true }));

    try {
      console.log(`Attempting to unfollow user with ID: ${userId}`);

      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      console.log("Unfollow response status:", response.status);

      if (response.ok) {
        // Update related queries
        queryClient.invalidateQueries({
          queryKey: [`/api/users/${userId}/followers/count`],
        });
        queryClient.invalidateQueries({
          queryKey: [`/api/users/${userId}/following/${currentUser?.id}`],
        });
        // Force update the cache
        queryClient.setQueryData(
          [`/api/users/${userId}/following/${currentUser?.id}`],
          { following: false }
        );

        setFollowStatus({
          isFollowing: false,
          isLoading: false,
          error: null,
        });

        toast({
          title: "Success",
          description: `You have unfollowed ${profileData?.username}`,
        });
      } else {
        // Try to get error message from response
        let errorMessage = "Failed to unfollow user";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error("Error parsing error response:", e);
        }

        setFollowStatus((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      setFollowStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to unfollow user",
      }));

      toast({
        title: "Error",
        description: error.message || "Failed to unfollow user",
        variant: "destructive",
      });
    }
  };

  // Combined handler for follow/unfollow
  const handleFollowToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to follow users",
        variant: "destructive",
      });
      return;
    }

    if (followStatus.isLoading) {
      return; // Prevent multiple clicks while loading
    }

    if (followStatus.isFollowing) {
      unfollowUser();
    } else {
      followUser();
    }
  };

  // Function to open modal and fetch followers or following
  const handleViewFollows = async (type) => {
    setModalType(type);
    setShowFollowModal(true);
    setIsModalLoading(true);

    try {
      const endpoint =
        type === "followers"
          ? `/api/users/${userId}/followers`
          : `/api/users/${userId}/following`;

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setModalUsers(data);
      } else {
        toast({
          title: "Error",
          description: `Failed to load ${type}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    } finally {
      setIsModalLoading(false);
    }
  };

  // Function to close the followers/following modal
  const closeModal = () => {
    setShowFollowModal(false);
    setModalUsers([]);
  };

  // Clear user data when user ID changes
  useEffect(() => {
    // Reset all user-specific data when userId changes
    setUserLikes([]);
    setUserComments([]);
    // Reset loading states
    setIsLikesLoading(false);
    setIsCommentsLoading(false);
  }, [userId]);

  // Using TanStack Query for data fetching with proper caching
  const { data: userLikesData } = useQuery({
    queryKey: [`/api/users/${effectiveUserId}/likes`],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      console.log(`Fetching likes for user ID: ${effectiveUserId}`);
      const response = await fetch(`/api/users/${effectiveUserId}/likes`);
      if (!response.ok) throw new Error(`Error fetching likes: ${response.statusText}`);
      return response.json();
    },
    enabled: activeTab === "likes" && !!effectiveUserId,
  });
  
  // Update local state when query data changes
  useEffect(() => {
    if (userLikesData) {
      setUserLikes(userLikesData);
    }
  }, [userLikesData]);

  // Use TanStack Query for comments fetching with proper caching
  const { data: userCommentsData, isLoading: commentsQueryLoading } = useQuery({
    queryKey: [`/api/users/${effectiveUserId}/comments`],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      console.log(`Fetching comments for user ID: ${effectiveUserId}`);
      const response = await fetch(`/api/users/${effectiveUserId}/comments`);
      if (!response.ok) throw new Error(`Error fetching comments: ${response.statusText}`);
      return response.json();
    },
    enabled: activeTab === "comments" && !!effectiveUserId,
  });
  
  // Update comments loading state based on query status
  useEffect(() => {
    setIsCommentsLoading(commentsQueryLoading);
  }, [commentsQueryLoading]);
  
  // Update local state when comments query data changes
  useEffect(() => {
    if (userCommentsData) {
      setUserComments(userCommentsData);
    }
  }, [userCommentsData]);

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
        });
        queryClient.invalidateQueries(["/api/profile"]);
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch("/api/profile/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        toast({
          title: "Password updated",
          description: "Your password has been updated successfully",
        });
      } else {
        throw new Error("Failed to update password");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Update profile form when profile data is loaded
  useEffect(() => {
    if (profileData && isPersonalProfile) {
      setProfileForm({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        email: profileData.email || "",
      });
    }
  }, [profileData, isPersonalProfile]);

  if (isProfileLoading) {
    return (
      <div className="min-h-screen">
        <div className="container max-w-5xl py-12 mx-auto px-4">
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        </div>
      </div>
    );
  }

  if ((profileError || !profileData) && effectiveUserId) {
    console.error("Profile error:", profileError);
    return (
      <div className="min-h-screen">
        <div className="container max-w-5xl py-12 mx-auto px-4">
          <div className="text-center py-12">
            <User className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              User Not Found
            </h1>
            <p className="text-gray-500 mb-6">
              The user you're looking for doesn't exist or has been removed.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Followers/Following Modal */}
      <Dialog open={showFollowModal} onOpenChange={setShowFollowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modalType === "followers" ? (
                <>
                  <UserCheck className="h-5 w-5 text-orange-500" /> Followers
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 text-orange-500" /> Following
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {modalType === "followers"
                ? `People who follow ${profileData?.username}`
                : `People ${profileData?.username} follows`}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto py-4">
            {isModalLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : modalUsers.length > 0 ? (
              <div className="space-y-4">
                {modalUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="h-10 w-10 cursor-pointer"
                        onClick={() => navigate(`/users/${user.id}`)}
                      >
                        <AvatarFallback className="bg-orange-100 text-orange-800">
                          {user.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p
                          className="font-medium hover:text-orange-600 cursor-pointer"
                          onClick={() => navigate(`/users/${user.id}`)}
                        >
                          {user.username}
                        </p>
                        {user.bio && (
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {isAuthenticated && currentUser?.id !== user.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                        onClick={() => {
                          setShowFollowModal(false); // Close the modal
                          navigate(`/users/${user.id}`);
                        }}
                      >
                        View Profile
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">
                  {modalType === "followers"
                    ? `${profileData?.username} doesn't have any followers yet.`
                    : `${profileData?.username} isn't following anyone yet.`}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <DialogClose asChild>
              <Button type="button" variant="secondary" onClick={closeModal}>
                Close
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Info Container */}
      <div className="container max-w-5xl py-8 mx-auto px-4">
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8 border border-orange-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-orange-100 text-orange-800 text-4xl font-bold">
                {profileData.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold mb-1">
                {profileData.username}
              </h2>
              <p className="text-gray-600 mb-4">
                {profileData.bio ||
                  "Learning enthusiast sharing knowledge and insights"}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-2">
                <div className="flex items-center gap-1 text-gray-600">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{userPosts?.length || 0} posts</span>
                </div>

                <div
                  className="flex items-center gap-1 text-gray-600 cursor-pointer hover:text-orange-600 transition-colors"
                  onClick={() => handleViewFollows("followers")}
                >
                  <UserCheck className="h-4 w-4 text-gray-500" />
                  <span className="hover:underline">
                    {followersCount || 0} followers
                  </span>
                </div>

                <div
                  className="flex items-center gap-1 text-gray-600 cursor-pointer hover:text-orange-600 transition-colors"
                  onClick={() => handleViewFollows("following")}
                >
                  <UserPlus className="h-4 w-4 text-gray-500" />
                  <span className="hover:underline">
                    {followingCount || 0} following
                  </span>
                </div>

                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>
                    Joined{" "}
                    {new Date(profileData.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {isAuthenticated && String(currentUser?.id) !== String(userId) && (
              <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                <Button
                  variant={followStatus.isFollowing ? "outline" : "default"}
                  className={
                    followStatus.isFollowing
                      ? "border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                      : "bg-orange-500 hover:bg-orange-600 text-white"
                  }
                  onClick={handleFollowToggle}
                  disabled={followStatus.isLoading}
                >
                  {followStatus.isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : followStatus.isFollowing ? (
                    <UserMinus className="h-4 w-4 mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  {followStatus.isFollowing ? "Unfollow" : "Follow"}
                </Button>
                
                {/* Add chat button if both users follow each other */}
                {profileData && (<ChatButton otherUser={profileData} />)}
              </div>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <Tabs
          defaultValue="posts"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList className="mb-6 bg-orange-50">
            {isPersonalProfile && (
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Posts</span>
            </TabsTrigger>
            <TabsTrigger value="likes" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span>Likes</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Comments</span>
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab (Personal Profile Only) */}
          {isPersonalProfile && (
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate}>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={profileForm.firstName}
                            onChange={handleProfileChange}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={profileForm.lastName}
                            onChange={handleProfileChange}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={profileForm.email}
                          onChange={handleProfileChange}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          name="username"
                          value={currentUser?.username || ""}
                          disabled
                          className="mt-1 bg-gray-50"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Username cannot be changed
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? "Updating..." : "Update Profile"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>Update your password</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordUpdate}>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <Label htmlFor="currentPassword">
                          Current Password
                        </Label>
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          className="mt-1"
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Password must be at least 8 characters
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? "Updating..." : "Update Password"}
                      </Button>
                    </div>
                  </form>
                </CardContent>

                <Separator className="my-4" />

                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>Manage your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="posts" className="py-4">
            {isPostsLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : userPosts?.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {userPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="overflow-hidden transition-all duration-300 hover:shadow-md group"
                  >
                    <div
                      onClick={() => navigate(`/post/${post.id}`)}
                      className="cursor-pointer"
                    >
                      <CardHeader className="pb-3 transition-colors duration-300 group-hover:bg-orange-50/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg transition-colors duration-300 group-hover:text-orange-700">
                              {post.title}
                            </CardTitle>
                            <CardDescription className="flex flex-wrap items-center mt-1 gap-x-2">
                              <div className="flex items-center">
                                <Calendar
                                  size={14}
                                  className="mr-1 text-orange-400"
                                />
                                <span>
                                  {new Date(
                                    post.createdAt
                                  ).toLocaleDateString()}
                                </span>
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
                              variant={
                                post.type === "thought"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="transition-all duration-300 group-hover:shadow-sm"
                            >
                              {post.type === "thought" ? (
                                <Lightbulb
                                  size={14}
                                  className="mr-1 text-amber-500"
                                />
                              ) : (
                                <BookOpen
                                  size={14}
                                  className="mr-1 text-blue-500"
                                />
                              )}
                              {post.type === "thought" ? "Thought" : "Resource"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="transition-colors duration-300 group-hover:bg-orange-50/30">
                        <p className="text-gray-700 whitespace-pre-line line-clamp-3 transition-colors duration-300 group-hover:text-gray-900">
                          {post.content}
                        </p>

                        {post.type === "resource" && post.resourceLink && (
                          <a
                            href={post.resourceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center mt-3 text-blue-600 hover:text-blue-800 hover:underline transform transition-all duration-300 hover:translate-x-1"
                            onClick={(e) => e.stopPropagation()} // Prevent navigating to post detail
                          >
                            View Resource{" "}
                            <ArrowRight size={16} className="ml-1" />
                          </a>
                        )}

                        <div className="flex flex-wrap gap-2 mt-4">
                          {post.tags &&
                            post.tags.map((tag) => (
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
                <MessageSquare
                  size={48}
                  className="mx-auto text-gray-300 mb-4"
                />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No posts yet
                </h3>
                <p className="text-gray-500">
                  {String(userId) === String(currentUser?.id)
                    ? "You haven't shared any posts yet. Start sharing your learning journey!"
                    : `${profileData.username} hasn't shared any posts yet.`}
                </p>

                {String(userId) === String(currentUser?.id) && (
                  <Button
                    className="mt-6 bg-orange-500 hover:bg-orange-600"
                    onClick={() => navigate("/share")}
                  >
                    Create Your First Post
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="likes" className="py-4">
            {isLikesLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : userLikes?.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {userLikes.map((post) => (
                  <Card
                    key={post.id}
                    className="overflow-hidden transition-all duration-300 hover:shadow-md group"
                  >
                    <div
                      onClick={() => navigate(`/post/${post.id}`)}
                      className="cursor-pointer"
                    >
                      <CardHeader className="pb-3 transition-colors duration-300 group-hover:bg-orange-50/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg transition-colors duration-300 group-hover:text-orange-700">
                              <span className="flex items-center gap-2">
                                <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                                {post.title}
                              </span>
                            </CardTitle>
                            <CardDescription className="flex flex-wrap items-center mt-1 gap-x-2">
                              <div className="flex items-center">
                                <Calendar
                                  size={14}
                                  className="mr-1 text-orange-400"
                                />
                                <span>
                                  {new Date(
                                    post.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <span className="inline-block mx-1">•</span>
                              <div
                                className="flex items-center cursor-pointer hover:text-orange-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/users/${post.userId}`);
                                }}
                              >
                                <User
                                  size={14}
                                  className="mr-1 text-green-500"
                                />
                                <span className="hover:underline">
                                  By {post.username || "Unknown"}
                                </span>
                              </div>
                              {post.views !== undefined && (
                                <>
                                  <span className="inline-block mx-1">•</span>
                                  <div className="flex items-center">
                                    <Eye
                                      size={14}
                                      className="mr-1 text-blue-400"
                                    />
                                    <span>{post.views || 0} views</span>
                                  </div>
                                </>
                              )}
                            </CardDescription>
                          </div>

                          {post.type && (
                            <div className="flex items-start space-x-2">
                              <Badge
                                variant={
                                  post.type === "thought"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="transition-all duration-300 group-hover:shadow-sm"
                              >
                                {post.type === "thought" ? (
                                  <Lightbulb
                                    size={14}
                                    className="mr-1 text-amber-500"
                                  />
                                ) : (
                                  <BookOpen
                                    size={14}
                                    className="mr-1 text-blue-500"
                                  />
                                )}
                                {post.type === "thought"
                                  ? "Thought"
                                  : "Resource"}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="transition-colors duration-300 group-hover:bg-orange-50/30">
                        <p className="text-gray-700 whitespace-pre-line line-clamp-3 transition-colors duration-300 group-hover:text-gray-900">
                          {post.content}
                        </p>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No liked posts yet
                </h3>
                <p className="text-gray-500">
                  {String(userId) === String(currentUser?.id)
                    ? "You haven't liked any posts yet. Explore content and show your appreciation!"
                    : `${profileData.username} hasn't liked any posts yet.`}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="py-4">
            {isCommentsLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : userComments?.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {userComments.map((post, index) => (
                  <Card
                    key={post.id}
                    className="overflow-hidden hover:shadow-md group border-l-4 border-l-orange-200 hover:border-l-orange-500 transition-all duration-300"
                    style={{
                      transform: "translateY(20px)",
                      opacity: 0,
                      animation: `fadeInUp 0.5s ease-out ${
                        index * 0.1
                      }s forwards`,
                    }}
                  >
                    <style jsx="true">{`
                      @keyframes fadeInUp {
                        from {
                          transform: translateY(20px);
                          opacity: 0;
                        }
                        to {
                          transform: translateY(0);
                          opacity: 1;
                        }
                      }
                      @keyframes pulse {
                        0% {
                          transform: scale(1);
                        }
                        50% {
                          transform: scale(1.05);
                        }
                        100% {
                          transform: scale(1);
                        }
                      }
                    `}</style>

                    <CardHeader className="pb-3 transition-colors duration-300 group-hover:bg-orange-50/70">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2 text-gray-800 group-hover:text-orange-700 transition-colors duration-300">
                            <MessageSquare className="h-5 w-5 text-orange-500" />
                            {post.title}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap items-center mt-1 gap-x-2">
                            <div className="flex items-center">
                              <Calendar
                                size={14}
                                className="mr-1 text-orange-400"
                              />
                              <span>
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <span className="inline-block mx-1">•</span>
                            <div
                              className="flex items-center cursor-pointer hover:text-orange-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/users/${post.userId}`);
                              }}
                            >
                              <User size={14} className="mr-1 text-green-500" />
                              <span className="hover:underline">
                                By {post.username || "Unknown"}
                              </span>
                            </div>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-2 pb-4">
                      <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-300 mb-4 relative">
                        <div className="absolute -top-2 -left-2 bg-orange-100 rounded-full p-1 shadow-sm">
                          <MessageSquare
                            size={16}
                            className="text-orange-600"
                          />
                        </div>
                        {post.userComments && post.userComments.length > 0 ? (
                          <div className="space-y-3">
                            {post.userComments.map((comment, i) => (
                              <div key={comment.id || i} className="mb-3 last:mb-0">
                                <p className="text-gray-700 whitespace-pre-line text-sm pl-4 italic">
                                  "{comment.content}"
                                </p>
                                <div className="text-xs text-gray-500 mt-1 text-right">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </div>
                                {i < post.userComments.length - 1 && <Separator className="mt-2" />}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-700 whitespace-pre-line text-sm pl-4 italic">
                            "Commented on this post"
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          <span className="inline-flex items-center">
                            <MessageSquare
                              size={14}
                              className="mr-1 text-gray-400"
                            />
                            {post.commentsCount || "Multiple"} comments
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-sm border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800 transition-all duration-300 hover:scale-105"
                          onClick={() => navigate(`/post/${post.id}`)}
                        >
                          <Eye size={14} className="mr-1" />
                          View Post
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div
                className="text-center py-12 bg-orange-50/50 rounded-lg border border-orange-100 shadow-sm"
                style={{
                  animation: "fadeIn 0.5s ease-out forwards",
                }}
              >
                <style jsx="true">{`
                  @keyframes fadeIn {
                    from {
                      opacity: 0;
                    }
                    to {
                      opacity: 1;
                    }
                  }
                `}</style>
                <MessageSquare
                  size={48}
                  className="mx-auto text-orange-200 mb-4"
                />
                <h3 className="text-xl font-medium text-gray-900 mb-1">
                  No comments yet
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {String(userId) === String(currentUser?.id)
                    ? "You haven't commented on any posts yet. Join the conversation to share your thoughts!"
                    : `${profileData.username} hasn't commented on any posts yet.`}
                </p>

                {String(userId) === String(currentUser?.id) && (
                  <Button
                    className="mt-6 bg-orange-500 hover:bg-orange-600 transition-all duration-300 hover:shadow-md"
                    onClick={() => navigate("/")}
                  >
                    <MessageSquare size={16} className="mr-2" />
                    Explore Learning Posts
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
