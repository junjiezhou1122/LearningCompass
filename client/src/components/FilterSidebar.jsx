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
    subCategory: false,
    courseType: false,
    language: false,
    rating: false,
    skills: false
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
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
      
      {/* Category Filter */}
      <div className="mb-4">
        <button 
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
          onClick={() => toggleSection('category')}
        >
          <span>Category</span>
          {openSections.category ? 
            <ChevronUp className="h-4 w-4 text-gray-400" /> : 
            <ChevronDown className="h-4 w-4 text-gray-400" />
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
            categories.map((category, index) => (
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
          
          {categories.length > 4 && (
            <button className="text-sm text-primary-600 hover:text-primary-700 mt-1">
              Show more
            </button>
          )}
        </div>
      </div>
      
      {/* Sub-Category Filter */}
      <div className="mb-4">
        <button 
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
          onClick={() => toggleSection('subCategory')}
        >
          <span>Sub-Category</span>
          {openSections.subCategory ? 
            <ChevronUp className="h-4 w-4 text-gray-400" /> : 
            <ChevronDown className="h-4 w-4 text-gray-400" />
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
            subCategories.map((subCategory, index) => (
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
          
          {subCategories.length > 4 && (
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
          <span>Course Type</span>
          {openSections.courseType ? 
            <ChevronUp className="h-4 w-4 text-gray-400" /> : 
            <ChevronDown className="h-4 w-4 text-gray-400" />
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
      
      {/* Rating Filter */}
      <div className="mb-4">
        <button 
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
          onClick={() => toggleSection('rating')}
        >
          <span>Rating</span>
          {openSections.rating ? 
            <ChevronUp className="h-4 w-4 text-gray-400" /> : 
            <ChevronDown className="h-4 w-4 text-gray-400" />
          }
        </button>
        
        <div className={`pl-2 overflow-hidden transition-all duration-300 ${openSections.rating ? 'max-h-60 overflow-y-auto' : 'max-h-0'}`}>
          {ratingOptions.map((option, index) => (
            <div key={index} className="flex items-center mb-2">
              <Checkbox 
                id={`rating-${index}`}
                checked={selectedFilters.ratings.includes(option.value)}
                onCheckedChange={(checked) => {
                  if (checked) handleRatingFilterChange(option.value);
                  else handleRatingFilterChange(option.value);
                }}
                className="mr-2"
              />
              <label htmlFor={`rating-${index}`} className="text-sm text-gray-700 cursor-pointer flex items-center">
                <div className="flex items-center text-yellow-400 mr-1">
                  <StarRating rating={option.value} />
                </div>
                <span className="ml-1">{option.label}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Language Filter */}
      <div className="mb-4">
        <button 
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
          onClick={() => toggleSection('language')}
        >
          <span>Language</span>
          {openSections.language ? 
            <ChevronUp className="h-4 w-4 text-gray-400" /> : 
            <ChevronDown className="h-4 w-4 text-gray-400" />
          }
        </button>
        
        <div className={`pl-2 overflow-hidden transition-all duration-300 ${openSections.language ? 'max-h-60 overflow-y-auto' : 'max-h-0'}`}>
          {isLoadingLanguages ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center mb-2">
                <Skeleton className="h-4 w-4 mr-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : languages.length > 0 ? (
            languages.map((language, index) => (
              <div key={index} className="flex items-center mb-2">
                <Checkbox 
                  id={`language-${index}`}
                  checked={selectedFilters.languages.includes(language)}
                  onCheckedChange={(checked) => {
                    if (checked) handleFilterChange('languages', language);
                    else handleFilterChange('languages', language);
                  }}
                  className="mr-2"
                />
                <label htmlFor={`language-${index}`} className="text-sm text-gray-700 cursor-pointer">
                  {language}
                </label>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No languages available</p>
          )}
          
          {languages.length > 4 && (
            <button className="text-sm text-primary-600 hover:text-primary-700 mt-1">
              Show more
            </button>
          )}
        </div>
      </div>
      
      {/* Skills Filter */}
      <div className="mb-4">
        <button 
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
          onClick={() => toggleSection('skills')}
        >
          <span>Skills</span>
          {openSections.skills ? 
            <ChevronUp className="h-4 w-4 text-gray-400" /> : 
            <ChevronDown className="h-4 w-4 text-gray-400" />
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
            skills.slice(0, 10).map((skill, index) => (
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
          
          {skills.length > 10 && (
            <button className="text-sm text-primary-600 hover:text-primary-700 mt-1">
              Show more
            </button>
          )}
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={applyFilters} 
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 w-full"
          size="lg"
        >
          Apply Filters
        </Button>
        <Button variant="outline" onClick={resetFilters} className="w-full" size="lg">
          Reset Filters
        </Button>
      </div>
    </aside>
  );
}
