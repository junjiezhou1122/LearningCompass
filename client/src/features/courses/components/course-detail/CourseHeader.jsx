import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle } from "@/components/ui/card";
import StarRating from "@/components/StarRating";
import { School } from "lucide-react";

export default function CourseHeader({ course }) {
  return (
    <CardHeader>
      <div className="flex flex-wrap gap-2 mb-2">
        {course.category && (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800"
          >
            {course.category}
          </Badge>
        )}
        {course.subCategory && (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800"
          >
            {course.subCategory}
          </Badge>
        )}
        {course.courseType && (
          <Badge className="bg-primary-600 text-white">
            {course.courseType}
          </Badge>
        )}
      </div>

      <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
        {course.title}
      </CardTitle>

      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
        {course.rating && (
          <div className="flex items-center">
            <StarRating rating={course.rating} size="md" />
            <span className="ml-1 font-medium">
              {course.rating.toFixed(1)}
            </span>
            {course.numberOfViewers && (
              <span className="ml-1 text-gray-500">
                (
                {new Intl.NumberFormat().format(course.numberOfViewers)}
                )
              </span>
            )}
          </div>
        )}

        {course.site && (
          <div className="flex items-center">
            <School className="h-4 w-4 mr-1 text-gray-400" />
            <span>{course.site}</span>
          </div>
        )}
      </div>
    </CardHeader>
  );
}
