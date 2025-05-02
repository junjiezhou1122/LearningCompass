import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";

export default function CourseCardImage({ 
  imageUrl, 
  title, 
  courseType, 
  isBookmarked,
  isPending,
  onBookmarkToggle,
  t
}) {
  return (
    <div className="relative overflow-hidden group">
      <img 
        src={imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=225&q=80"} 
        alt={title} 
        className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <Button
        size="icon"
        variant={isBookmarked ? "default" : "ghost"}
        className={`absolute top-3 right-3 rounded-full h-8 w-8 z-10 transition-all duration-300 
                  ${isBookmarked 
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md hover:from-orange-600 hover:to-amber-700' 
                    : 'bg-white/90 backdrop-blur-sm hover:bg-gray-50 border border-gray-100 hover:shadow-md'}`}
        onClick={onBookmarkToggle}
        disabled={isPending}
        aria-label={isBookmarked ? t("removeBookmark") : t("addBookmark")}
      >
        <Bookmark 
          className={`h-4 w-4 ${isBookmarked ? 'fill-white text-white' : 'text-gray-500'} transition-transform duration-300 hover:scale-110`} 
        />
        {isPending && <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        </span>}
      </Button>
      {courseType && (
        <div className="absolute bottom-3 left-3 bg-white/90 text-gray-800 text-xs font-medium px-3 py-1.5 rounded-md backdrop-blur-sm shadow-sm border border-gray-100 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-400">
          {courseType}
        </div>
      )}
    </div>
  );
}
