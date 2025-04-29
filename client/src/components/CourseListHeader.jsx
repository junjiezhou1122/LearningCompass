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
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">{title}</h1>
        <div className="flex items-center mt-2 sm:mt-0">
          <span className="text-sm font-medium text-gray-600 mr-3">Sort by:</span>
          <Select value={sortOption} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px] bg-white border-gray-300 rounded-lg shadow-sm text-gray-700">
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
        <div className="flex flex-wrap gap-2 mb-6">
          {activeFilters.map((filter) => (
            <Badge 
              key={filter.id} 
              variant="secondary"
              className="bg-[#EEF2FF] text-[#4264f0] hover:bg-[#E0E7FF] py-1.5 px-3 rounded-md text-sm font-medium border-0"
            >
              {filter.label}
              <button 
                className="ml-2 text-[#4264f0] hover:text-[#3755d6] focus:outline-none" 
                onClick={() => onRemoveFilter && onRemoveFilter(filter.id)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
