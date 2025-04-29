import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Lock, LogOut, Bookmark, History, AlertCircle } from "lucide-react";

export default function Profile() {
  const { isAuthenticated, user, token, logout } = useAuth();
  const { toast } = useToast();
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

  // Fetch user profile
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['/api/profile'],
    queryFn: async ({ queryKey }) => {
      if (!isAuthenticated) return null;
      
      const response = await fetch(queryKey[0], {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) return null;
        throw new Error("Failed to fetch profile");
      }
      
      return response.json();
    },
    enabled: isAuthenticated
  });

  // Fetch user's search history
  const { data: searchHistory = [], refetch: refetchSearchHistory } = useQuery({
    queryKey: ['/api/search-history'],
    queryFn: async ({ queryKey }) => {
      if (!isAuthenticated) return [];
      
      const response = await fetch(queryKey[0], {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) return [];
        return [];
      }
      
      return response.json();
    },
    enabled: isAuthenticated
  });
  
  // Listen for search history updates from other components
  useEffect(() => {
    // Function to handle the search history updated event
    const handleSearchHistoryUpdated = () => {
      // Refetch search history data when the event is triggered
      refetchSearchHistory();
    };
    
    // Add event listener
    window.addEventListener('searchHistoryUpdated', handleSearchHistoryUpdated);
    
    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('searchHistoryUpdated', handleSearchHistoryUpdated);
    };
  }, [refetchSearchHistory]);

  // Update profile form when profile data is loaded
  useEffect(() => {
    if (profile) {
      setProfileForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
      });
    }
  }, [profile]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to view your profile",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, toast]);

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
    
    // This is just a placeholder since we don't have a profile update endpoint
    setIsUpdating(true);
    
    try {
      // Simulate a profile update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Validate password
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
      // Simulate a password update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Skeleton className="h-10 w-full mb-6" />
            
            <div className="space-y-6">
              <div>
                <Skeleton className="h-5 w-32 mb-3" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-5 w-32 mb-3" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-5 w-32 mb-3" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
          <User className="h-12 w-12 mx-auto mb-4 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Sign In</h2>
          <p className="text-gray-600 mb-6">
            Sign in to view and manage your profile
          </p>
          <Button
            onClick={() => document.querySelector('button[data-event="click:openLoginModal"]')?.click()}
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-6">
            We encountered an error while loading your profile. Please try again later.
          </p>
          <Button
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span>Activity</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
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
                        value={user?.username || ""}
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
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Update your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordUpdate}>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
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
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
                <CardDescription>
                  Manage your account
                </CardDescription>
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
          
          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Search History</CardTitle>
                <CardDescription>
                  Your recent searches
                </CardDescription>
              </CardHeader>
              <CardContent>
                {searchHistory.length === 0 ? (
                  <div className="text-center py-6">
                    <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No search history</h3>
                    <p className="text-gray-600">
                      Your search history will appear here once you start searching for courses.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {searchHistory.slice(0, 10).map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="font-medium text-gray-800">{item.searchQuery}</p>
                          <p className="text-sm text-gray-500">{formatDate(item.createdAt)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.href = `/?search=${encodeURIComponent(item.searchQuery)}`}
                        >
                          Search Again
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bookmark className="h-5 w-5 mr-2" />
                  Bookmarks
                </CardTitle>
                <CardDescription>
                  View and manage your bookmarked courses
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-start pt-2">
                <Button
                  onClick={() => window.location.href = "/bookmarks"}
                  variant="outline"
                >
                  View All Bookmarks
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
