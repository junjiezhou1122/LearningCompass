import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { Link } from "wouter";

function RecommendationItem({ item }) {
  const course = item.course || item;
  return (
    <div className="group">
      <Link to={`/course/${course.id}`} className="block">
        <div className="p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
          <h4 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-1">
            {course.title}
          </h4>
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
            {course.shortIntro}
          </p>
          {item.reason && (
            <div className="text-xs text-blue-500 mt-1">{item.reason}</div>
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
                <TrendingUp className="h-3 w-3 mr-0.5" /> Trending
              </Badge>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

function RecommendationsList({ recommendations }) {
  if (!recommendations.length) {
    return <p className="text-sm text-gray-500 p-2">No recommendations available</p>;
  }
  return (
    <div className="space-y-3">
      {recommendations.map((item, idx) => (
        <div key={idx}>
          <RecommendationItem item={item} />
          {idx < recommendations.length - 1 && <Separator className="mt-2 mb-1 bg-gray-100" />}
        </div>
      ))}
    </div>
  );
}

export default function RecommendationsPage() {
  const { user, isAuthenticated, token } = useAuth();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch recommendations (paginated)
  const {
    data: recommendations = [],
    isLoading,
  } = useQuery({
    queryKey: [isAuthenticated ? "/api/recommendations" : "/api/recommendations/anonymous", user?.id, page, pageSize],
    queryFn: async ({ queryKey }) => {
      const [endpoint] = queryKey;
      let url = endpoint;
      if (isAuthenticated && user) {
        url += `?userId=${user.id}&limit=${pageSize}&offset=${(page - 1) * pageSize}`;
      } else {
        url += `?limit=${pageSize}&offset=${(page - 1) * pageSize}`;
      }
      const response = await fetch(url, {
        headers: isAuthenticated ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch recommendations");
      return response.json();
    },
    enabled: isAuthenticated ? !!user : true,
    keepPreviousData: true,
  });

  // Loading state
  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>All Recommendations</CardTitle>
          <CardDescription>Browse all recommended courses for you</CardDescription>
        </CardHeader>
        <CardContent>
          {Array(pageSize)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="mb-4">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>All Recommendations</CardTitle>
        <CardDescription>Browse all recommended courses for you</CardDescription>
      </CardHeader>
      <CardContent>
        <RecommendationsList recommendations={recommendations} />
        {/* Pagination controls */}
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-gray-500">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={recommendations.length < pageSize}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 