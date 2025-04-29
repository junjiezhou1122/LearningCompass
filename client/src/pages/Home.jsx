import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Hero from "@/components/Hero";
import FilterSidebar from "@/components/FilterSidebar";
import CourseList from "@/components/CourseList";
import CourseListHeader from "@/components/CourseListHeader";
import Pagination from "@/components/Pagination";

export default function Home() {
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
  const [filters, setFilters] = useState({});
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortBy, setSortBy] = useState("recommended");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const { toast } = useToast();

  // Extract search query from URL and listen for search events
  useEffect(() => {
    // Function to update the search parameters
    const updateSearch = () => {
      const currentParams = new URLSearchParams(window.location.search);
      const query = currentParams.get("search") || "";
      const page = parseInt(currentParams.get("page") || "1", 10);
      const sort = currentParams.get("sort") || "recommended";
      
      // Update state based on URL parameters
      setCurrentPage(page);
      setSortBy(sort);
      setSearchParams(currentParams);
      
      // Update URL if parameters change
      const newParams = new URLSearchParams();
      if (query) newParams.append("search", query);
      if (page > 1) newParams.append("page", page.toString());
      if (sort !== "recommended") newParams.append("sort", sort);
      
      const newUrl = `${window.location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ""}`;
      window.history.replaceState({}, "", newUrl);
    };

    // Call once on initial load
    updateSearch();
    
    // Listen for custom search event from Header component
    const handleSearchEvent = (e) => {
      updateSearch();
    };
    
    window.addEventListener('updateSearchParams', handleSearchEvent);
    window.addEventListener('popstate', updateSearch);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('updateSearchParams', handleSearchEvent);
      window.removeEventListener('popstate', updateSearch);
    };
  }, []);

  // Get courses count for pagination
  const { data: courseCountData = { count: 0 } } = useQuery({
    queryKey: ['/api/courses/count', filters],
    queryFn: async () => {
      // Build query params for count
      const params = new URLSearchParams();
      
      if (searchParams.get("search")) {
        params.append("search", searchParams.get("search"));
      }
      
      if (filters.category) {
        params.append("category", filters.category);
      }
      
      if (filters.subCategory) {
        params.append("subCategory", filters.subCategory);
      }
      
      if (filters.courseType) {
        params.append("courseType", filters.courseType);
      }
      
      if (filters.language) {
        params.append("language", filters.language);
      }
      
      if (filters.rating) {
        params.append("rating", filters.rating.toString());
      }
      
      const response = await fetch(`/api/courses/count?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch course count");
      }
      
      return response.json();
    }
  });

  const totalPages = Math.ceil(courseCountData.count / itemsPerPage);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    
    // Update URL
    const newParams = new URLSearchParams(searchParams);
    if (page > 1) {
      newParams.set("page", page.toString());
    } else {
      newParams.delete("page");
    }
    
    const newUrl = `${window.location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ""}`;
    window.history.pushState({}, "", newUrl);
    setSearchParams(newParams);
  };

  // Handle sort change
  const handleSortChange = (value) => {
    setSortBy(value);
    
    // Update URL
    const newParams = new URLSearchParams(searchParams);
    if (value !== "recommended") {
      newParams.set("sort", value);
    } else {
      newParams.delete("sort");
    }
    
    const newUrl = `${window.location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ""}`;
    window.history.pushState({}, "", newUrl);
    setSearchParams(newParams);
  };

  // Handle filter apply
  const handleApplyFilters = (selectedFilters) => {
    // Convert selected filters to active filters array for display
    const newActiveFilters = [];
    
    selectedFilters.categories.forEach(category => {
      newActiveFilters.push({
        id: `category-${category}`,
        type: 'category',
        value: category,
        label: category
      });
    });
    
    selectedFilters.subCategories.forEach(subCategory => {
      newActiveFilters.push({
        id: `subCategory-${subCategory}`,
        type: 'subCategory',
        value: subCategory,
        label: subCategory
      });
    });
    
    selectedFilters.courseTypes.forEach(courseType => {
      newActiveFilters.push({
        id: `courseType-${courseType}`,
        type: 'courseType',
        value: courseType,
        label: courseType
      });
    });
    
    selectedFilters.languages.forEach(language => {
      newActiveFilters.push({
        id: `language-${language}`,
        type: 'language',
        value: language,
        label: language
      });
    });
    
    selectedFilters.ratings.forEach(rating => {
      newActiveFilters.push({
        id: `rating-${rating}`,
        type: 'rating',
        value: rating,
        label: `${rating}+ Rating`
      });
    });
    
    selectedFilters.skills.forEach(skill => {
      newActiveFilters.push({
        id: `skill-${skill}`,
        type: 'skill',
        value: skill,
        label: skill
      });
    });
    
    setActiveFilters(newActiveFilters);
    
    // Convert selected filters to filters object for API
    const apiFilters = {
      category: selectedFilters.categories.length > 0 ? selectedFilters.categories[0] : undefined,
      subCategory: selectedFilters.subCategories.length > 0 ? selectedFilters.subCategories[0] : undefined,
      courseType: selectedFilters.courseTypes.length > 0 ? selectedFilters.courseTypes[0] : undefined,
      language: selectedFilters.languages.length > 0 ? selectedFilters.languages[0] : undefined,
      rating: selectedFilters.ratings.length > 0 ? Math.min(...selectedFilters.ratings) : undefined,
    };
    
    setFilters(apiFilters);
    setCurrentPage(1); // Reset to first page when applying filters
    
    toast({
      title: "Filters applied",
      description: "Showing courses matching your filters",
    });
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setFilters({});
    setActiveFilters([]);
    
    toast({
      title: "Filters reset",
      description: "Showing all courses",
    });
  };

  // Handle filter removal
  const handleRemoveFilter = (filterId) => {
    const filterToRemove = activeFilters.find(filter => filter.id === filterId);
    
    if (!filterToRemove) return;
    
    // Remove from active filters
    const newActiveFilters = activeFilters.filter(filter => filter.id !== filterId);
    setActiveFilters(newActiveFilters);
    
    // Update filters object
    const newFilters = { ...filters };
    
    if (filterToRemove.type === 'category') {
      delete newFilters.category;
    } else if (filterToRemove.type === 'subCategory') {
      delete newFilters.subCategory;
    } else if (filterToRemove.type === 'courseType') {
      delete newFilters.courseType;
    } else if (filterToRemove.type === 'language') {
      delete newFilters.language;
    } else if (filterToRemove.type === 'rating') {
      delete newFilters.rating;
    }
    
    setFilters(newFilters);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Hero Section */}
      <Hero />
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filter Sidebar */}
        <div className="lg:w-1/4">
          <FilterSidebar
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            initialFilters={{
              categories: activeFilters.filter(f => f.type === 'category').map(f => f.value),
              subCategories: activeFilters.filter(f => f.type === 'subCategory').map(f => f.value),
              courseTypes: activeFilters.filter(f => f.type === 'courseType').map(f => f.value),
              languages: activeFilters.filter(f => f.type === 'language').map(f => f.value),
              ratings: activeFilters.filter(f => f.type === 'rating').map(f => f.value),
              skills: activeFilters.filter(f => f.type === 'skill').map(f => f.value),
            }}
          />
        </div>
        
        {/* Course Content */}
        <div className="lg:w-3/4">
          {/* Course List Header */}
          <CourseListHeader
            title={searchParams.get("search") ? `Search Results: "${searchParams.get("search")}"` : "Recommended Courses"}
            activeFilters={activeFilters}
            onRemoveFilter={handleRemoveFilter}
            sortBy={sortBy}
            onSortChange={handleSortChange}
          />
          
          {/* Course List */}
          <CourseList
            filters={filters}
            searchQuery={searchParams.get("search") || ""}
            sortBy={sortBy}
            limit={itemsPerPage}
            page={currentPage}
          />
          
          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
