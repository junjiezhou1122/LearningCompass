import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  BookmarkPlus,
  BookmarkCheck,
  ExternalLink,
} from "lucide-react";

/**
 * Props:
 * - course: course object
 * - isBookmarked: boolean
 * - onToggleBookmark: (courseId) => void
 * - onDetails: (courseId) => void
 */
const UniversityCourseCard = ({
  course,
  isBookmarked,
  onToggleBookmark,
  onDetails,
}) => {
  return (
    <Card
      className="overflow-hidden border-orange-100 hover:border-orange-300 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
    >
      <CardHeader className="bg-gradient-to-r from-orange-100/40 to-amber-100/40 pb-3">
        <CardTitle className="text-lg font-bold text-orange-800 flex justify-between">
          <span className="truncate">
            {course.courseNumber}: {course.courseTitle}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleBookmark(course.id);
            }}
            className="text-orange-500 hover:text-orange-700 transition-colors"
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-5 w-5 animate-scale" />
            ) : (
              <BookmarkPlus className="h-5 w-5" />
            )}
          </button>
        </CardTitle>
        <div className="flex items-center gap-2 mb-1">
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200"
          >
            {course.university}
          </Badge>
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
          >
            {course.courseDept}
          </Badge>
        </div>
        <CardDescription className="text-gray-600 line-clamp-2">
          {course.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Professors:</span>
            <span className="text-gray-700 font-medium">
              {course.professors}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Recent Semesters:</span>
            <span className="text-gray-700 font-medium">
              {course.recentSemesters}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex justify-between">
        <Button
          variant="outline"
          className="text-orange-700 hover:text-orange-800 hover:bg-orange-50 flex items-center gap-1 border-orange-200"
          onClick={() => onDetails(course.id)}
        >
          Course Details <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 flex items-center gap-1"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (course.url)
              window.open(course.url, "_blank", "noopener,noreferrer");
          }}
        >
          University Site <ExternalLink className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UniversityCourseCard; 