import { Button } from "@/components/ui/button";
import { useFilterContext } from "./FilterContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FilterActions() {
  const { applyFilters, resetFilters } = useFilterContext();
  const { t } = useLanguage();
  
  return (
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
  );
}
