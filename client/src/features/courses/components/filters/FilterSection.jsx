import { ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useFilterContext } from "./FilterContext";

export default function FilterSection({ 
  title,
  sectionKey,
  items = [],
  filterType,
  isLoading = false,
  emptyMessage = "No items available",
  loadingCount = 4
}) {
  const { openSections, toggleSection, selectedFilters, handleFilterChange } = useFilterContext();
  
  return (
    <div className="mb-6">
      <button 
        className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-3"
        onClick={() => toggleSection(sectionKey)}
      >
        <span className="text-base font-medium text-gray-800">{title}</span>
        {openSections[sectionKey] ? 
          <ChevronUp className="h-4 w-4 text-gray-500" /> : 
          <ChevronDown className="h-4 w-4 text-gray-500" />
        }
      </button>
      
      <div className={`pl-1 overflow-hidden transition-all duration-300 ${openSections[sectionKey] ? 'max-h-60 overflow-y-auto pr-1' : 'max-h-0'}`}>
        {isLoading ? (
          Array(loadingCount).fill(0).map((_, i) => (
            <div key={i} className="flex items-center mb-3">
              <Skeleton className="h-4 w-4 mr-3" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))
        ) : items.length > 0 ? (
          items.map((item, index) => (
            <div key={index} className="flex items-center mb-3">
              <Checkbox 
                id={`${sectionKey}-${index}`}
                checked={selectedFilters[filterType].includes(item)}
                onCheckedChange={(checked) => {
                  if (checked) handleFilterChange(filterType, item);
                  else handleFilterChange(filterType, item);
                }}
                className="mr-3 border-gray-300 data-[state=checked]:bg-[#4264f0] data-[state=checked]:border-[#4264f0]"
              />
              <label htmlFor={`${sectionKey}-${index}`} className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                {item}
              </label>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}
