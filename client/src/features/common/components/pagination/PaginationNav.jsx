import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import PaginationItem from "./PaginationItem";

export default function PaginationNav({
  currentPage,
  totalPages,
  pageNumbers,
  onPageChange
}) {
  const { t } = useLanguage();
  
  return (
    <div className="flex items-center space-x-1.5">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label={t('previous')}
        className="h-8 w-8 rounded-md border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {pageNumbers.map((page, index) => (
        <PaginationItem
          key={page === "ellipsis" ? `ellipsis-${index}` : page}
          page={page}
          currentPage={currentPage}
          onClick={onPageChange}
        />
      ))}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label={t('next')}
        className="h-8 w-8 rounded-md border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
