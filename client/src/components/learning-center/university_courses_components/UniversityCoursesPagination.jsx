import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

/**
 * Props:
 * - page: number
 * - totalPages: number
 * - isLoadingCount: boolean
 * - coursesLength: number
 * - onPageChange: (page: number) => void
 */
const UniversityCoursesPagination = ({
  page,
  totalPages,
  isLoadingCount,
  coursesLength,
  onPageChange,
}) => {
  if (isLoadingCount && coursesLength > 0) {
    return (
      <div className="flex justify-center mt-8">
        <div className="animate-spin h-6 w-6 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  if (totalPages <= 1) return null;
  return (
    <Pagination className="mt-8">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page > 1) onPageChange(page - 1);
            }}
            className={page === 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        {/* Show first page */}
        {page > 2 && (
          <PaginationItem>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(1);
              }}
            >
              1
            </PaginationLink>
          </PaginationItem>
        )}
        {/* Show ellipsis if needed */}
        {page > 3 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {/* Show previous page */}
        {page > 1 && (
          <PaginationItem>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(page - 1);
              }}
            >
              {page - 1}
            </PaginationLink>
          </PaginationItem>
        )}
        {/* Current page */}
        <PaginationItem>
          <PaginationLink href="#" isActive onClick={(e) => e.preventDefault()}>
            {page}
          </PaginationLink>
        </PaginationItem>
        {/* Show next page */}
        {page < totalPages && (
          <PaginationItem>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(page + 1);
              }}
            >
              {page + 1}
            </PaginationLink>
          </PaginationItem>
        )}
        {/* Show ellipsis if needed */}
        {page < totalPages - 2 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {/* Show last page */}
        {page < totalPages - 1 && (
          <PaginationItem>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(totalPages);
              }}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page < totalPages) onPageChange(page + 1);
            }}
            className={
              page === totalPages ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default UniversityCoursesPagination; 