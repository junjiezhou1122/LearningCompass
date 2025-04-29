import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp } from "lucide-react";
import StarRating from "./StarRating";

export default function FilterSidebar({ 
  onApplyFilters,
  onResetFilters,
  initialFilters = {}
}) {
  // State for open/closed filter sections
  const [openSections, setOpenSections] = useState({
    category: true,
    courseType: true,
    skills: true, 
    subCategory: false, // Less frequently used
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
    <aside className="lg:w-full bg-white rounded-lg shadow-sm p-4 h-fit sticky top-24">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Filter Courses</h2>
      
      {/* Category Filter */}
      <div className="mb-4">
        <button 
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
          onClick={() => toggleSection('category')}
        >
          <span className="text-base font-semibold">Category</span>
          {openSections.category ? 
            <ChevronUp className="h-5 w-5 text-gray-600" /> : 
            <ChevronDown className="h-5 w-5 text-gray-600" />
          }
        </button>
        
        <div className={`pl-2 overflow-hidden transition-all duration-300 ${openSections.category ? 'max-h-60 overflow-y-auto' : 'max-h-0'}`}>
          {isLoadingCategories ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center mb-2">
                <Skeleton className="h-4 w-4 mr-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : categories.length > 0 ? (
            categories.slice(0, 6).map((category, index) => (
              <div key={index} className="flex items-center mb-2">
                <Checkbox 
                  id={`category-${index}`}
                  checked={selectedFilters.categories.includes(category)}
                  onCheckedChange={(checked) => {
                    if (checked) handleFilterChange('categories', category);
                    else handleFilterChange('categories', category);
                  }}
                  className="mr-2"
                />
                <label htmlFor={`category-${index}`} className="text-sm text-gray-700 cursor-pointer">
                  {category}
                </label>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No categories available</p>
          )}
          
          {categories.length > 6 && (
            <button className="text-sm text-primary-600 hover:text-primary-700 mt-1">
              Show more
            </button>
          )}
        </div>
      </div>
      
      {/* Course Type Filter */}
      <div className="mb-4">
        <button 
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
          onClick={() => toggleSection('courseType')}
        >
          <span className="text-base font-semibold">Course Type</span>
          {openSections.courseType ? 
            <ChevronUp className="h-5 w-5 text-gray-600" /> : 
            <ChevronDown className="h-5 w-5 text-gray-600" />
          }
        </button>
        
        <div className={`pl-2 overflow-hidden transition-all duration-300 ${openSections.courseType ? 'max-h-60 overflow-y-auto' : 'max-h-0'}`}>
          {isLoadingCourseTypes ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center mb-2">
                <Skeleton className="h-4 w-4 mr-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : courseTypes.length > 0 ? (
            courseTypes.map((courseType, index) => (
              <div key={index} className="flex items-center mb-2">
                <Checkbox 
                  id={`course-type-${index}`}
                  checked={selectedFilters.courseTypes.includes(courseType)}
                  onCheckedChange={(checked) => {
                    if (checked) handleFilterChange('courseTypes', courseType);
                    else handleFilterChange('courseTypes', courseType);
                  }}
                  className="mr-2"
                />
                <label htmlFor={`course-type-${index}`} className="text-sm text-gray-700 cursor-pointer">
                  {courseType}
                </label>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No course types available</p>
          )}
        </div>
      </div>
      
      {/* Skills Filter */}
      <div className="mb-6">
        <button 
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
          onClick={() => toggleSection('skills')}
        >
          <span className="text-base font-semibold">Skills</span>
          {openSections.skills ? 
            <ChevronUp className="h-5 w-5 text-gray-600" /> : 
            <ChevronDown className="h-5 w-5 text-gray-600" />
          }
        </button>
        
        <div className={`pl-2 overflow-hidden transition-all duration-300 ${openSections.skills ? 'max-h-60 overflow-y-auto' : 'max-h-0'}`}>
          {isLoadingSkills ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center mb-2">
                <Skeleton className="h-4 w-4 mr-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : skills.length > 0 ? (
            skills.slice(0, 8).map((skill, index) => (
              <div key={index} className="flex items-center mb-2">
                <Checkbox 
                  id={`skill-${index}`}
                  checked={selectedFilters.skills.includes(skill)}
                  onCheckedChange={(checked) => {
                    if (checked) handleFilterChange('skills', skill);
                    else handleFilterChange('skills', skill);
                  }}
                  className="mr-2"
                />
                <label htmlFor={`skill-${index}`} className="text-sm text-gray-700 cursor-pointer">
                  {skill}
                </label>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No skills available</p>
          )}
          
          {skills.length > 8 && (
            <button className="text-sm text-primary-600 hover:text-primary-700 mt-1">
              Show more
            </button>
          )}
        </div>
      </div>
      
      {/* Subcategory in collapsed state by default */}
      <div className="mb-4">
        <button 
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
          onClick={() => toggleSection('subCategory')}
        >
          <span className="text-base font-semibold">Sub-Category</span>
          {openSections.subCategory ? 
            <ChevronUp className="h-5 w-5 text-gray-600" /> : 
            <ChevronDown className="h-5 w-5 text-gray-600" />
          }
        </button>
        
        <div className={`pl-2 overflow-hidden transition-all duration-300 ${openSections.subCategory ? 'max-h-60 overflow-y-auto' : 'max-h-0'}`}>
          {isLoadingSubCategories ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center mb-2">
                <Skeleton className="h-4 w-4 mr-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : subCategories.length > 0 ? (
            subCategories.slice(0, 6).map((subCategory, index) => (
              <div key={index} className="flex items-center mb-2">
                <Checkbox 
                  id={`subcategory-${index}`}
                  checked={selectedFilters.subCategories.includes(subCategory)}
                  onCheckedChange={(checked) => {
                    if (checked) handleFilterChange('subCategories', subCategory);
                    else handleFilterChange('subCategories', subCategory);
                  }}
                  className="mr-2"
                />
                <label htmlFor={`subcategory-${index}`} className="text-sm text-gray-700 cursor-pointer">
                  {subCategory}
                </label>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No subcategories available</p>
          )}
          
          {subCategories.length > 6 && (
            <button className="text-sm text-primary-600 hover:text-primary-700 mt-1">
              Show more
            </button>
          )}
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <div className="flex flex-col gap-3">
        <Button 
          onClick={applyFilters} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 text-lg"
          size="lg"
        >
          Apply Filters
        </Button>
        <Button variant="outline" onClick={resetFilters} className="border-gray-300" size="default">
          Reset All Filters
        </Button>
      </div>
    </aside>
  );
}
