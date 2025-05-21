// frontend/src/components/ui/Pagination.tsx
"use client";

import React from "react";
import { cn } from "@/utils/cn";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "minimal";
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
  size = "md",
  variant = "default",
}: PaginationProps) => {
  // Helper function to create range array
  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
  };

  // Generate page numbers to display
  const generatePagination = () => {
    // Cases with few pages - show all
    if (totalPages <= 5) {
      return range(1, totalPages);
    }

    // Calculate ranges for different sections
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    // Whether to show ellipsis
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    // Always show first and last page
    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    // Case: show left dots but no right dots
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [firstPageIndex, "left-dots", ...rightRange];
    }

    // Case: show right dots but no left dots
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, "right-dots", lastPageIndex];
    }

    // Case: show both left and right dots
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [
        firstPageIndex,
        "left-dots",
        ...middleRange,
        "right-dots",
        lastPageIndex,
      ];
    }
  };

  // Get array of page numbers to render
  const paginationRange = generatePagination();

  // Don't render if there's only one page
  if (currentPage === 0 || totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  };

  // Variant classes
  const getVariantClasses = (isActive: boolean) => {
    if (variant === "default") {
      return isActive
        ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600";
    }

    if (variant === "outline") {
      return isActive
        ? "border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-500 border bg-blue-50 dark:bg-blue-900/20"
        : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-600 dark:hover:border-blue-500";
    }

    if (variant === "minimal") {
      return isActive
        ? "text-blue-600 dark:text-blue-500 font-medium"
        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200";
    }

    return "";
  };

  return (
    <nav className={cn("flex items-center justify-center", className)}>
      <ul className="flex items-center">
        {/* Previous button */}
        <li>
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className={cn(
              "flex items-center justify-center rounded-md",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600",
              "transition-colors duration-200",
              getVariantClasses(false),
              sizeClasses[size],
              currentPage === 1 && "opacity-50 cursor-not-allowed",
            )}
            aria-label="Previous page"
          >
            <ChevronLeft size={size === "sm" ? 14 : size === "md" ? 16 : 18} />
          </button>
        </li>

        {/* Page numbers */}
        {paginationRange?.map((pageNumber, i) => {
          if (pageNumber === "left-dots" || pageNumber === "right-dots") {
            return (
              <li key={`dots-${i}`} className="mx-1">
                <div
                  className={cn(
                    "flex items-center justify-center",
                    sizeClasses[size],
                  )}
                >
                  <MoreHorizontal
                    size={size === "sm" ? 14 : size === "md" ? 16 : 18}
                  />
                </div>
              </li>
            );
          }

          const isActive = pageNumber === currentPage;

          return (
            <li key={pageNumber} className="mx-1">
              <button
                onClick={() => onPageChange(pageNumber as number)}
                className={cn(
                  "flex items-center justify-center rounded-md",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600",
                  "transition-colors duration-200",
                  getVariantClasses(isActive),
                  sizeClasses[size],
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {pageNumber}
              </button>
            </li>
          );
        })}

        {/* Next button */}
        <li className="ml-1">
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={cn(
              "flex items-center justify-center rounded-md",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600",
              "transition-colors duration-200",
              getVariantClasses(false),
              sizeClasses[size],
              currentPage === totalPages && "opacity-50 cursor-not-allowed",
            )}
            aria-label="Next page"
          >
            <ChevronRight size={size === "sm" ? 14 : size === "md" ? 16 : 18} />
          </button>
        </li>
      </ul>
    </nav>
  );
};
