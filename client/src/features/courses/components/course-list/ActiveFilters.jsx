import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export default function ActiveFilters({ filters = [], onRemoveFilter }) {
  if (!filters || filters.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filters.map((filter) => (
        <Badge 
          key={filter.id} 
          variant="secondary"
          className="bg-[#f8fafc] text-gray-700 hover:bg-gray-100 py-1.5 px-3 rounded-md text-sm border border-gray-200"
        >
          {filter.label}
          <button 
            className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none" 
            onClick={() => onRemoveFilter && onRemoveFilter(filter.id)}
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
