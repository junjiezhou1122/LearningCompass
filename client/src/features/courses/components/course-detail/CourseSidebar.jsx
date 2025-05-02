import { useLanguage } from "@/contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Bookmark } from "lucide-react";

export default function CourseSidebar({ 
  course, 
  isBookmarked, 
  isBookmarking, 
  onBookmarkToggle, 
  onShare, 
  t 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("courseDetails")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider */}
        {course.site && (
          <div className="flex items-center justify-between text-gray-700">
            <span>{t("provider")}</span>
            <span className="font-medium">{course.site}</span>
          </div>
        )}

        {/* Language */}
        {course.language && (
          <div className="flex items-center justify-between text-gray-700">
            <span>{t("language")}</span>
            <span className="font-medium">{course.language}</span>
          </div>
        )}

        {/* Course Type */}
        {course.courseType && (
          <div className="flex items-center justify-between text-gray-700">
            <span>{t("type")}</span>
            <span className="font-medium">{course.courseType}</span>
          </div>
        )}

        {/* Duration */}
        {course.duration && (
          <div className="flex items-center justify-between text-gray-700">
            <span>{t("duration")}</span>
            <span className="font-medium">{course.duration}</span>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="pt-2">
          <Button
            className="w-full mb-3 bg-blue-600 hover:bg-blue-700 shadow-md"
            size="lg"
            onClick={() => window.open(course.url, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2 text-white" />
            <span className="text-white font-medium">{t("goToCourse")}</span>
          </Button>

          <div className="flex gap-2">
            <Button
              variant={isBookmarked ? "default" : "outline"}
              className={`flex-1 gap-2 ${isBookmarked
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "border-amber-500 text-amber-600 hover:bg-amber-50"
                }`}
              onClick={onBookmarkToggle}
              disabled={isBookmarking}
            >
              <Bookmark className="h-4 w-4" />
              {isBookmarked ? t("bookmarked") : t("bookmark")}
            </Button>
            
            <Button
              variant="outline"
              className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
              onClick={onShare}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {t("share")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
