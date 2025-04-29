import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

export default function CourseListHeader({ 
  title = "Recommended Courses", 
  activeFilters = [],
  onRemoveFilter,
  sortBy = "recommended",
  onSortChange
}) {
  const [sortOption, setSortOption] = useState(sortBy);
  
  // Update sort option if prop changes
  useEffect(() => {
    setSortOption(sortBy);
  }, [sortBy]);
  
  // Handle sort selection change
  const handleSortChange = (value) => {
    setSortOption(value);
    if (onSortChange) {
      onSortChange(value);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">{title}</h1>
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">Sort by:</span>
          <Select value={sortOption} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="highest_rated">Highest Rated</SelectItem>
              <SelectItem value="most_popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {activeFilters && activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {activeFilters.map((filter) => (
            <Badge 
              key={filter.id} 
              variant="secondary"
              className="bg-primary-100 text-primary-800 hover:bg-primary-200"
            >
              {filter.label}
              <button 
                className="ml-1 text-primary-600 hover:text-primary-800" 
                onClick={() => onRemoveFilter && onRemoveFilter(filter.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
