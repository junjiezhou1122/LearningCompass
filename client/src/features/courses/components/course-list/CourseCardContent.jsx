import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { User, Clock, Globe } from "lucide-react";
import { truncateText } from "@/lib/utils";

export default function CourseCardContent({ course }) {
  return (
    <CardContent className="p-5 flex-grow">
      <div className="flex flex-wrap gap-2 mb-3">
        {course.category && (
          <Badge variant="secondary" className="bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100 transition-all duration-300 hover:scale-105">
            {course.category}
          </Badge>
        )}
        {course.subCategory && (
          <Badge variant="secondary" className="bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100 transition-all duration-300 hover:scale-105">
            {course.subCategory}
          </Badge>
        )}
      </div>
      
      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors duration-300">
        {course.title}
      </h3>
      
      {course.shortIntro && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {truncateText(course.shortIntro, 100)}
        </p>
      )}
      
      {course.instructors && (
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <User className="h-4 w-4 mr-2 text-orange-400 transition-transform duration-300 hover:scale-110" />
          <span>{truncateText(course.instructors, 30)}</span>
        </div>
      )}
      
      <div className="flex items-center text-sm text-gray-500 mb-3">
        {course.duration && (
          <div className="flex items-center mr-4">
            <Clock className="h-4 w-4 mr-2 text-orange-400 transition-transform duration-300 hover:scale-110" />
            <span>{course.duration}</span>
          </div>
        )}
        {course.language && (
          <div className="flex items-center">
            <Globe className="h-4 w-4 mr-2 text-orange-400 transition-transform duration-300 hover:scale-110" />
            <span>{course.language}</span>
          </div>
        )}
      </div>
    </CardContent>
  );
}
