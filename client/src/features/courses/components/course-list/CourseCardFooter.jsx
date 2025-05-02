import { CardFooter } from "@/components/ui/card";
import StarRating from "@/components/StarRating";

export default function CourseCardFooter({ course }) {
  return (
    <CardFooter className="border-t border-orange-100 px-5 py-3 bg-gradient-to-r from-orange-50 to-amber-50 flex items-center justify-between transition-colors duration-300">
      <div className="flex items-center">
        <StarRating rating={course.rating || 0} />
        <span className="ml-2 text-sm text-gray-700">
          {course.rating?.toFixed(1) || "N/A"}
        </span>
        {course.numberOfViewers && (
          <span className="ml-1 text-xs text-gray-500">
            ({new Intl.NumberFormat().format(course.numberOfViewers)})
          </span>
        )}
      </div>
      
      {course.site && (
        <div className="text-sm text-orange-500 font-medium">
          {course.site}
        </div>
      )}
    </CardFooter>
  );
}
