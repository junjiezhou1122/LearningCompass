import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, BookOpen, Target, Zap, Star, TrendingUp } from "lucide-react";

export default function RecommendationSidebar() {
  const { user, isAuthenticated } = useAuth();
  const [userLevel, setUserLevel] = useState(1);
  const [userPoints, setUserPoints] = useState(0);
  const [nextLevelPoints, setNextLevelPoints] = useState(100);
  const [earnedBadges, setEarnedBadges] = useState([]);
  
  // Calculate the progress percentage towards next level
  const progressPercentage = (userPoints / nextLevelPoints) * 100;
  
  // Fetch personalized recommendations if user is authenticated
  const { data: recommendations = [], isLoading: isLoadingAuthRecommendations } = useQuery({
    queryKey: ['/api/recommendations', user?.id],
    queryFn: async ({ queryKey }) => {
      if (!isAuthenticated || !user) return [];
      
      const response = await fetch(`${queryKey[0]}?userId=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch recommendations");
      return response.json();
    },
    enabled: !!isAuthenticated && !!user
  });
  
  // Fetch anonymous recommendations if user is not authenticated
  const { data: anonymousRecommendations = [], isLoading: isLoadingAnonymousRecommendations } = useQuery({
    queryKey: ['/api/recommendations/anonymous'],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0]);
      if (!response.ok) throw new Error("Failed to fetch anonymous recommendations");
      return response.json();
    },
    enabled: !isAuthenticated
  });
  
  // Fetch user gamification data
  const { data: gamificationData, isLoading: isLoadingGamification } = useQuery({
    queryKey: ['/api/user/gamification', user?.id],
    queryFn: async ({ queryKey }) => {
      if (!isAuthenticated || !user) return { level: 1, points: 0, nextLevelPoints: 100, badges: [] };
      
      const response = await fetch(`${queryKey[0]}?userId=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch gamification data");
      return response.json();
    },
    enabled: !!isAuthenticated && !!user
  });
  
  // Update gamification data when received
  useEffect(() => {
    if (gamificationData) {
      setUserLevel(gamificationData.level || 1);
      setUserPoints(gamificationData.points || 0);
      setNextLevelPoints(gamificationData.nextLevelPoints || 100);
      setEarnedBadges(gamificationData.badges || []);
    }
  }, [gamificationData]);
  
  // Determine which recommendations to display
  // If authenticated but no recommendations, fall back to anonymous ones
  const displayRecommendations = isAuthenticated && recommendations.length > 0 
    ? recommendations 
    : anonymousRecommendations;
  
  // Determine if recommendations are loading
  const isLoading = isAuthenticated 
    ? isLoadingAuthRecommendations 
    : isLoadingAnonymousRecommendations;
  
  // For debugging
  console.log("Final display recommendations:", displayRecommendations);
  
  // Debug recommendations
  useEffect(() => {
    console.log("Auth status:", isAuthenticated);
    console.log("Anonymous recommendations:", anonymousRecommendations);
    console.log("Auth recommendations:", recommendations);
    console.log("Display recommendations:", displayRecommendations);
  }, [isAuthenticated, anonymousRecommendations, recommendations, displayRecommendations]);
  
  return (
    <aside className="w-full">
      {/* Gamification Card */}
      <Card className="mb-6 border-orange-100 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg text-orange-900">Your Progress</CardTitle>
            {isAuthenticated ? (
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                Level {userLevel}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                Sign in to track
              </Badge>
            )}
          </div>
          {isAuthenticated && (
            <CardDescription>
              <div className="flex flex-col mt-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{userPoints} points</span>
                  <span>{nextLevelPoints} points needed</span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-2 bg-orange-100" 
                  indicatorColor="bg-gradient-to-r from-orange-400 to-amber-500" 
                />
              </div>
            </CardDescription>
          )}
        </CardHeader>
        
        {isAuthenticated ? (
          <CardContent className="pt-4 pb-2">
            <h4 className="text-sm font-medium flex items-center mb-2">
              <Award className="h-4 w-4 text-amber-500 mr-1" />
              <span>Your Achievements</span>
            </h4>
            
            {isLoadingGamification ? (
              <div className="flex gap-1 flex-wrap">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-8 w-16 rounded-full" />
                ))}
              </div>
            ) : earnedBadges.length > 0 ? (
              <div className="flex gap-1 flex-wrap">
                {earnedBadges.map((badge, idx) => (
                  <Badge key={idx} variant="outline" 
                    className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-700 text-xs">
                    {badge.icon === 'star' && <Star className="h-3 w-3 mr-1" />}
                    {badge.icon === 'zap' && <Zap className="h-3 w-3 mr-1" />}
                    {badge.icon === 'book' && <BookOpen className="h-3 w-3 mr-1" />}
                    {badge.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">Complete activities to earn badges!</p>
            )}
          </CardContent>
        ) : (
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Sign in to track your learning progress</p>
              <Button variant="outline" size="sm" className="text-xs h-8 border-orange-200 text-orange-700 hover:bg-orange-50">
                Sign In
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Recommendations Card */}
      <Card className="border-orange-100">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 pb-3">
          <div className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-orange-600" />
            <CardTitle className="text-lg text-orange-900">Recommended For You</CardTitle>
          </div>
          <CardDescription>
            Courses tailored to your interests
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4 px-3 pb-1">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="mb-4">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : displayRecommendations.length > 0 ? (
            <div className="space-y-3">
              {displayRecommendations.map((item, idx) => (
                <div key={idx} className="group">
                  <Link to={`/course/${item.id}`} className="block">
                    <div className="p-2 rounded-lg group-hover:bg-orange-50 transition-colors">
                      <h4 className="font-medium text-gray-900 group-hover:text-orange-700 transition-colors line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                        {item.shortIntro}
                      </p>
                      <div className="flex items-center mt-1.5">
                        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 border-gray-200 text-gray-600 bg-gray-50">
                          {item.category}
                        </Badge>
                        {item.trending && (
                          <Badge variant="outline" className="ml-1 text-xs px-1.5 py-0 h-5 border-orange-200 text-orange-700 bg-orange-50 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-0.5" />
                            Trending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                  {idx < displayRecommendations.length - 1 && (
                    <Separator className="mt-2 mb-1 bg-gray-100" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 p-2">No recommendations available</p>
          )}
        </CardContent>
        
        <CardFooter className="pt-0 pb-3 px-4">
          <Button variant="ghost" size="sm" className="w-full text-xs border-t border-gray-100 pt-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50">
            View All Recommendations
          </Button>
        </CardFooter>
      </Card>
      
      {/* Learning Streak Card */}
      <Card className="mt-6 border-orange-100">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 pb-3">
          <div className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-orange-600" />
            <CardTitle className="text-lg text-orange-900">Daily Streak</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          {isAuthenticated ? (
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 flex items-center justify-center mb-2">
                <span className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">
                  {gamificationData?.streak || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600 text-center">
                {gamificationData?.streak ? 
                  `You've been learning for ${gamificationData.streak} days in a row!` : 
                  "Start your learning streak today!"}
              </p>
              <Button className="mt-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white">
                Continue Learning
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center mb-2">
                <span className="text-3xl font-bold text-gray-400">0</span>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Sign in to track your daily learning streak
              </p>
              <Button variant="outline" className="mt-3 border-orange-200 text-orange-700 hover:bg-orange-50">
                Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}