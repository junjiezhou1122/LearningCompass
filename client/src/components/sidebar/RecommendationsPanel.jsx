import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, TrendingUp } from "lucide-react";

export default function RecommendationsPanel() {
  const { user, isAuthenticated } = useAuth();
  
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
  
  // Determine which recommendations to display
  // If authenticated but no recommendations, fall back to anonymous ones
  const displayRecommendations = isAuthenticated && recommendations.length > 0 
    ? recommendations 
    : anonymousRecommendations;
  
  // Determine if recommendations are loading
  const isLoading = isAuthenticated 
    ? isLoadingAuthRecommendations 
    : isLoadingAnonymousRecommendations;
  
  return (
    <Card className="border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
        <div className="flex items-center">
          <Target className="h-5 w-5 mr-2 text-blue-600" />
          <CardTitle className="text-lg text-blue-900">Recommended For You</CardTitle>
        </div>
        <CardDescription className="text-blue-700">
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
                  <div className="p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                    <h4 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-1">
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
                        <Badge variant="outline" className="ml-1 text-xs px-1.5 py-0 h-5 border-blue-200 text-blue-700 bg-blue-50 flex items-center">
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
        <Button variant="ghost" size="sm" className="w-full text-xs border-t border-gray-100 pt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
          View All Recommendations
        </Button>
      </CardFooter>
    </Card>
  );
}