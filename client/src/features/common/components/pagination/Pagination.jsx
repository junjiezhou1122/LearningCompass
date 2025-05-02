import { useLanguage } from "@/contexts/LanguageContext";
import PaginationNav from "./PaginationNav";
import { usePagination } from "./usePagination";

export default function Pagination({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange 
}) {
  const { t } = useLanguage();
  const { pageNumbers, handlePageChange } = usePagination({
    currentPage,
    totalPages,
    onPageChange
  });
  
  // Don't render if only one page
  if (totalPages <= 1) {
    return null;
  }
  
  return (
    <nav className="flex flex-col items-center justify-center space-y-2">
      <PaginationNav 
        currentPage={currentPage}
        totalPages={totalPages}
        pageNumbers={pageNumbers}
        onPageChange={handlePageChange}
      />
      <div className="text-xs text-gray-500">
        {t('page')} {currentPage} {t('of')} {totalPages}
      </div>
    </nav>
  );
}
