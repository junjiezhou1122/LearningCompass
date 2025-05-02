import { useQuery } from "@tanstack/react-query";

export function useFetchFilterData() {
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
  
  return {
    categories,
    isLoadingCategories,
    subCategories,
    isLoadingSubCategories,
    courseTypes,
    isLoadingCourseTypes,
    languages,
    isLoadingLanguages,
    skills,
    isLoadingSkills
  };
}
