import { createContext, useContext, useState, useEffect } from "react";

const FilterContext = createContext();

export function useFilterContext() {
  return useContext(FilterContext);
}

export function FilterProvider({ children, initialFilters = {}, onApplyFilters, onResetFilters }) {
  // State for open/closed filter sections
  const [openSections, setOpenSections] = useState({
    category: true,
    subCategory: true,
    courseType: true,
  });
  
  // State for selected filters
  const [selectedFilters, setSelectedFilters] = useState({
    categories: initialFilters.categories || [],
    subCategories: initialFilters.subCategories || [],
    courseTypes: initialFilters.courseTypes || [],
    languages: initialFilters.languages || [],
    ratings: initialFilters.ratings || [],
    skills: initialFilters.skills || []
  });
  
  // Update selected filters if props change
  useEffect(() => {
    setSelectedFilters({
      categories: initialFilters.categories || [],
      subCategories: initialFilters.subCategories || [],
      courseTypes: initialFilters.courseTypes || [],
      languages: initialFilters.languages || [],
      ratings: initialFilters.ratings || [],
      skills: initialFilters.skills || []
    });
  }, [initialFilters]);
  
  // Toggle filter section
  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Handle filter selection change
  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => {
      const currentFilters = [...prev[filterType]];
      
      if (currentFilters.includes(value)) {
        return {
          ...prev,
          [filterType]: currentFilters.filter(item => item !== value)
        };
      } else {
        // For single-select filters (categories, subCategory, courseType, language)
        // replace the current selection instead of adding to the array
        if (filterType === 'categories' || filterType === 'subCategories' || 
            filterType === 'courseTypes' || filterType === 'languages') {
          return {
            ...prev,
            [filterType]: [value] // Replace with single value
          };
        } else {
          // For multi-select filters (skills), add to the array
          return {
            ...prev,
            [filterType]: [...currentFilters, value]
          };
        }
      }
    });
  };
  
  // Handle rating filter selection
  const handleRatingFilterChange = (rating) => {
    setSelectedFilters(prev => {
      const currentRatings = [...prev.ratings];
      
      if (currentRatings.includes(rating)) {
        return {
          ...prev,
          ratings: currentRatings.filter(r => r !== rating)
        };
      } else {
        // Rating should be single-select - use only one rating filter at a time
        return {
          ...prev,
          ratings: [rating] // Replace instead of adding
        };
      }
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    if (onApplyFilters) {
      onApplyFilters(selectedFilters);
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setSelectedFilters({
      categories: [],
      subCategories: [],
      courseTypes: [],
      languages: [],
      ratings: [],
      skills: []
    });
    
    if (onResetFilters) {
      onResetFilters();
    }
  };
  
  const value = {
    openSections,
    toggleSection,
    selectedFilters,
    handleFilterChange,
    handleRatingFilterChange,
    applyFilters,
    resetFilters
  };
  
  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}
