import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import StarRating from "./StarRating";

export default function FilterSidebar({ 
  onApplyFilters,
  onResetFilters,
  initialFilters = {}
}) {
  const { t } = useLanguage();
  // State for open/closed filter sections
  const [openSections, setOpenSections] = useState({
    category: true,
    subCategory: true, // Now opened by default and shown right after category
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
  
  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0]);
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    }
  });
  
  // Fetch subcategories
  const { data: subCategories = [], isLoading: isLoadingSubCategories } = useQuery({
    queryKey: ['/api/subcategories'],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0]);
      if (!response.ok) throw new Error("Failed to fetch subcategories");
      return response.json();
    }
  });
  
  // Fetch course types
  const { data: courseTypes = [], isLoading: isLoadingCourseTypes } = useQuery({
    queryKey: ['/api/course-types'],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0]);
      if (!response.ok) throw new Error("Failed to fetch course types");
      return response.json();
    }
  });
  
  // Fetch languages
  const { data: languages = [], isLoading: isLoadingLanguages } = useQuery({
    queryKey: ['/api/languages'],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0]);
      if (!response.ok) throw new Error("Failed to fetch languages");
      return response.json();
    }
  });
  
  // Fetch skills
  const { data: skills = [], isLoading: isLoadingSkills } = useQuery({
    queryKey: ['/api/skills'],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0]);
      if (!response.ok) throw new Error("Failed to fetch skills");
      return response.json();
    }
  });
  
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
  
  // Rating options
  const ratingOptions = [
    { value: 4.5, label: '4.5 & up' },
    { value: 4.0, label: '4.0 & up' },
    { value: 3.0, label: '3.0 & up' }
  ];
  
  return (
    <aside className="w-full bg-white rounded-xl border border-gray-100 p-6 h-fit sticky top-24">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('filterBy')}</h2>
      
      {/* Category Filter */}
      <div className="mb-6">
        <button 
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-3"
          onClick={() => toggleSection('category')}
        >
          <span className="text-base font-medium text-gray-800">{t('category')}</span>
          {openSections.category ? 
            <ChevronUp className="h-4 w-4 text-gray-500" /> : 
            <ChevronDown className="h-4 w-4 text-gray-500" />
          }
        </button>
        
        <div className={`pl-1 overflow-hidden transition-all duration-300 ${openSections.category ? 'max-h-60 overflow-y-auto pr-1' : 'max-h-0'}`}>
          {isLoadingCategories ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center mb-3">
                <Skeleton className="h-4 w-4 mr-3" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : categories.length > 0 ? (
            categories.map((category, index) => (
              <div key={index} className="flex items-center mb-3">
                <Checkbox 
                  id={`category-${index}`}
                  checked={selectedFilters.categories.includes(category)}
                  onCheckedChange={(checked) => {
                    if (checked) handleFilterChange('categories', category);
                    else handleFilterChange('categories', category);
                  }}
                  className="mr-3 border-gray-300 data-[state=checked]:bg-[#4264f0] data-[state=checked]:border-[#4264f0]"
                />
                <label htmlFor={`category-${index}`} className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                  {category}
                </label>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">{t('noCategoriesAvailable')}</p>
          )}
        </div>
      </div>
      
      {/* Sub-Category Filter */}
      <div className="mb-6">
        <button 
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-3"
          onClick={() => toggleSection('subCategory')}
        >
          <span className="text-base font-medium text-gray-800">{t('subCategory')}</span>
          {openSections.subCategory ? 
            <ChevronUp className="h-4 w-4 text-gray-500" /> : 
            <ChevronDown className="h-4 w-4 text-gray-500" />
          }
        </button>
        
        <div className={`pl-1 overflow-hidden transition-all duration-300 ${openSections.subCategory ? 'max-h-60 overflow-y-auto pr-1' : 'max-h-0'}`}>
          {isLoadingSubCategories ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center mb-3">
                <Skeleton className="h-4 w-4 mr-3" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : subCategories.length > 0 ? (
            subCategories.map((subCategory, index) => (
              <div key={index} className="flex items-center mb-3">
                <Checkbox 
                  id={`subcategory-${index}`}
                  checked={selectedFilters.subCategories.includes(subCategory)}
                  onCheckedChange={(checked) => {
                    if (checked) handleFilterChange('subCategories', subCategory);
                    else handleFilterChange('subCategories', subCategory);
                  }}
                  className="mr-3 border-gray-300 data-[state=checked]:bg-[#4264f0] data-[state=checked]:border-[#4264f0]"
                />
                <label htmlFor={`subcategory-${index}`} className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                  {subCategory}
                </label>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">{t('noSubCategoriesAvailable')}</p>
          )}
        </div>
      </div>
      
      {/* Course Type Filter */}
      <div className="mb-6">
        <button 
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-3"
          onClick={() => toggleSection('courseType')}
        >
          <span className="text-base font-medium text-gray-800">{t('courseType')}</span>
          {openSections.courseType ? 
            <ChevronUp className="h-4 w-4 text-gray-500" /> : 
            <ChevronDown className="h-4 w-4 text-gray-500" />
          }
        </button>
        
        <div className={`pl-1 overflow-hidden transition-all duration-300 ${openSections.courseType ? 'max-h-60 overflow-y-auto pr-1' : 'max-h-0'}`}>
          {isLoadingCourseTypes ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center mb-3">
                <Skeleton className="h-4 w-4 mr-3" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : courseTypes.length > 0 ? (
            courseTypes.map((courseType, index) => (
              <div key={index} className="flex items-center mb-3">
                <Checkbox 
                  id={`course-type-${index}`}
                  checked={selectedFilters.courseTypes.includes(courseType)}
                  onCheckedChange={(checked) => {
                    if (checked) handleFilterChange('courseTypes', courseType);
                    else handleFilterChange('courseTypes', courseType);
                  }}
                  className="mr-3 border-gray-300 data-[state=checked]:bg-[#4264f0] data-[state=checked]:border-[#4264f0]"
                />
                <label htmlFor={`course-type-${index}`} className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                  {courseType}
                </label>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">{t('noCourseTypesAvailable')}</p>
          )}
        </div>
      </div>
      
      <Separator className="my-6 bg-gray-100" />
      
      <div className="flex flex-col gap-3">
        <Button 
          onClick={applyFilters} 
          className="bg-[#4264f0] hover:bg-[#3755d6] text-white font-medium py-5 px-4 rounded-md text-sm h-auto"
        >
          {t('applyFilters')}
        </Button>
        <Button 
          variant="outline" 
          onClick={resetFilters} 
          className="border-gray-200 text-gray-600 font-normal hover:bg-gray-50 rounded-md py-2 h-auto"
        >
          {t('resetFilters')}
        </Button>
      </div>
    </aside>
  );
}
