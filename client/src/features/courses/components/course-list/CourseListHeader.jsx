import SortOptions from "./SortOptions";
import ActiveFilters from "./ActiveFilters";

export default function CourseListHeader({ 
  title = "Recommended Courses", 
  activeFilters = [],
  onRemoveFilter,
  sortBy = "recommended",
  onSortChange
}) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">{title}</h1>
        <SortOptions sortBy={sortBy} onSortChange={onSortChange} />
      </div>
      
      <ActiveFilters filters={activeFilters} onRemoveFilter={onRemoveFilter} />
    </div>
  );
}
