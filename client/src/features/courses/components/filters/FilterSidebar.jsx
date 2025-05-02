import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { FilterProvider } from "./FilterContext";
import FilterSection from "./FilterSection";
import FilterActions from "./FilterActions";
import { useFetchFilterData } from "./useFetchFilterData";

export default function FilterSidebar({ 
  onApplyFilters,
  onResetFilters,
  initialFilters = {}
}) {
  const { t } = useLanguage();
  const { 
    categories,
    isLoadingCategories,
    subCategories,
    isLoadingSubCategories,
    courseTypes,
    isLoadingCourseTypes
  } = useFetchFilterData();
  
  return (
    <FilterProvider 
      initialFilters={initialFilters}
      onApplyFilters={onApplyFilters}
      onResetFilters={onResetFilters}
    >
      <aside className="w-full bg-white rounded-xl border border-gray-100 p-6 h-fit sticky top-24">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('filterBy')}</h2>
        
        {/* Category Filter */}
        <FilterSection 
          title={t('category')}
          sectionKey="category"
          items={categories}
          filterType="categories"
          isLoading={isLoadingCategories}
          emptyMessage={t('noCategoriesAvailable')}
        />
        
        {/* Sub-Category Filter */}
        <FilterSection 
          title={t('subCategory')}
          sectionKey="subCategory"
          items={subCategories}
          filterType="subCategories"
          isLoading={isLoadingSubCategories}
          emptyMessage={t('noSubCategoriesAvailable')}
        />
        
        {/* Course Type Filter */}
        <FilterSection 
          title={t('courseType')}
          sectionKey="courseType"
          items={courseTypes}
          filterType="courseTypes"
          isLoading={isLoadingCourseTypes}
          emptyMessage={t('noCourseTypesAvailable')}
          loadingCount={3}
        />
        
        <Separator className="my-6 bg-gray-100" />
        
        <FilterActions />
      </aside>
    </FilterProvider>
  );
}
