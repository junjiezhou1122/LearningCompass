import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Pagination,
  PaginationContent,
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
  const { t } = useLanguage();
  const start = (page - 1) * 9 + 1;
  const end = start + coursesLength - 1;

  if (isLoadingCount && coursesLength > 0) {
    return (
      <div className="flex justify-center mt-8">
        <div className="animate-spin h-6 w-6 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  if (totalPages <= 1) return null;
  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(page - 1)}
              className={page <= 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          {/* Show first page */}
          {page > 2 && (
            <PaginationItem>
              <PaginationLink
                onClick={() => onPageChange(1)}
              >
                1
              </PaginationLink>
            </PaginationItem>
          )}
          {/* Show ellipsis if needed */}
          {page > 3 && (
            <PaginationItem>
              <PaginationLink
                onClick={() => onPageChange(page - 1)}
              >
                {page - 1}
              </PaginationLink>
            </PaginationItem>
          )}
          {/* Current page */}
          <PaginationItem>
            <PaginationLink
              onClick={() => onPageChange(page)}
              isActive={true}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
          {/* Show next page */}
          {page < totalPages && (
            <PaginationItem>
              <PaginationLink
                onClick={() => onPageChange(page + 1)}
              >
                {page + 1}
              </PaginationLink>
            </PaginationItem>
          )}
          {/* Show ellipsis if needed */}
          {page < totalPages - 2 && (
            <PaginationItem>
              <PaginationLink
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(page + 1)}
              className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      {!isLoadingCount && (
        <p className="text-sm text-gray-500">
          {t("showingCourses", { start, end, total: totalPages * 9 })}
        </p>
      )}
    </div>
  );
};

export default UniversityCoursesPagination; 