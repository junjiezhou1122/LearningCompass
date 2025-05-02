import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SortOptions({ sortBy = "recommended", onSortChange }) {
  const [sortOption, setSortOption] = useState(sortBy);
  const { t } = useLanguage();
  
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
    <div className="flex items-center mt-2 sm:mt-0">
      <span className="text-sm text-gray-600 mr-3">{t('sortBy')}</span>
      <Select value={sortOption} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[180px] bg-white border-gray-200 rounded-md text-gray-700 text-sm focus:ring-[#4264f0]/20">
          <SelectValue placeholder={t('sortBy')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recommended">{t('recommended')}</SelectItem>
          <SelectItem value="highest_rated">{t('highestRated')}</SelectItem>
          <SelectItem value="most_popular">{t('mostPopular')}</SelectItem>
          <SelectItem value="newest">{t('newest')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
