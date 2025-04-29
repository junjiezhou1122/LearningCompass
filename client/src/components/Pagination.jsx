import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange 
}) {
  // Don't render if only one page
  if (totalPages <= 1) {
    return null;
  }
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Always include first page
    pageNumbers.push(1);
    
    // Current page neighborhood
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pageNumbers.push(i);
    }
    
    // Always include last page if more than 1 page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    // Add ellipses where needed
    const result = [];
    let prevPage = null;
    
    for (const page of pageNumbers) {
      if (prevPage && page > prevPage + 1) {
        result.push("ellipsis");
      }
      result.push(page);
      prevPage = page;
    }
    
    return result;
  };
  
  const pageNumbers = getPageNumbers();
  
  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };
  
  return (
    <nav className="flex justify-center">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="h-9 w-9 rounded-md border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {pageNumbers.map((page, index) => 
          page === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">...</span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              className={currentPage === page 
                ? "bg-[#4264f0] hover:bg-[#3755d6] text-white h-9 w-9 rounded-md" 
                : "text-gray-700 h-9 w-9 rounded-md border-gray-300 hover:bg-gray-50"}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </Button>
          )
        )}
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="h-9 w-9 rounded-md border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
