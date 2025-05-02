import { Button } from "@/components/ui/button";

export default function PaginationItem({ 
  page, 
  currentPage, 
  onClick 
}) {
  if (page === "ellipsis") {
    return <span className="px-3 py-1.5 text-gray-400">...</span>;
  }
  
  return (
    <Button
      variant={currentPage === page ? "default" : "outline"}
      className={currentPage === page 
        ? "bg-[#4264f0] hover:bg-[#3755d6] text-white h-8 w-8 rounded-md font-medium text-sm" 
        : "text-gray-600 h-8 w-8 rounded-md border-gray-200 hover:bg-gray-50 font-normal text-sm"}
      onClick={() => onClick(page)}
    >
      {page}
    </Button>
  );
}
