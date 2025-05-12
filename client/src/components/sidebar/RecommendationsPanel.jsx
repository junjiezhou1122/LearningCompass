import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function RecommendationsPanel() {
  const { user, isAuthenticated, token } = useAuth();
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Fetch personalized recommendations if user is authenticated
  const {
    data: recommendations = [],
    isLoading: isLoadingAuthRecommendations,
  } = useQuery({
    queryKey: ["recommendations", { page, pageSize, isAuthenticated, token }],
    queryFn: async () => {
      if (isAuthenticated && token) {
        const res = await fetch(
          `/api/recommendations?limit=${pageSize}&offset=${(page - 1) * pageSize}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to fetch recommendations");
        return res.json();
      } else {
        const res = await fetch(
          `/api/recommendations/anonymous?limit=${pageSize}&offset=${(page - 1) * pageSize}`
        );
        if (!res.ok) throw new Error("Failed to fetch recommendations");
        return res.json();
      }
    },
    keepPreviousData: true,
  });

  // Determine which recommendations to display
  const displayRecommendations =
    isAuthenticated && recommendations.length > 0
      ? recommendations
      : [];

  // Determine if recommendations are loading
  const isLoading = isAuthenticated
    ? isLoadingAuthRecommendations
    : false;

  return (
    <Card className="border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
        <div className="flex items-center">
          <Target className="h-5 w-5 mr-2 text-blue-600" />
          <CardTitle className="text-lg text-blue-900">
            Recommended For You
          </CardTitle>
        </div>
        <CardDescription className="text-blue-700">
          Courses tailored to your interests
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 px-3 pb-1">
        {isLoading ? (
          Array(pageSize)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="mb-4">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
        ) : displayRecommendations.length > 0 ? (
          <div className="space-y-3">
            {displayRecommendations.map((item, idx) => {
              // Use course property if present (personalized), else fallback (anonymous)
              const course = item.course || item;
              return (
                <div key={idx} className="group">
                  <Link to={`/course/${course.id}`} className="block">
                    <div className="p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                      <h4 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                        {course.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                        {course.shortIntro}
                      </p>
                      {item.reason && (
                        <div className="text-xs text-blue-500 mt-1">
                          {item.reason}
                        </div>
                      )}
                      <div className="flex items-center mt-1.5">
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0 h-5 border-gray-200 text-gray-600 bg-gray-50"
                        >
                          {course.category}
                        </Badge>
                        {course.trending && (
                          <Badge
                            variant="outline"
                            className="ml-1 text-xs px-1.5 py-0 h-5 border-blue-200 text-blue-700 bg-blue-50 flex items-center"
                          >
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
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 p-2">
            No recommendations available
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-3 px-4 flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <span className="text-xs text-gray-500">Page {page}</span>
        <Button
          variant="ghost"
          size="sm"
          disabled={displayRecommendations.length < pageSize}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </CardFooter>
    </Card>
  );
}
