// src/components/ui/PaginationControls.tsx
'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { usePagination } from '@/contexts/PaginationContext';
import { cn } from '@/utils/cn';

interface PaginationControlsProps {
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  showPageJumper?: boolean;
  showItemRange?: boolean;
  align?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  showPageSizeSelector = true,
  pageSizeOptions = [10, 20, 50, 100],
  showPageJumper = false,
  showItemRange = true,
  align = 'center',
  size = 'md',
  className,
}) => {
  const {
    page,
    pageSize,
    totalItems,
    totalPages,
    pageNumbers,
    pageRange,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    canNextPage,
    canPrevPage,
  } = usePagination();

  // For page jumper
  const [jumpValue, setJumpValue] = React.useState('');

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
  };

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();

    const pageNum = parseInt(jumpValue, 10);
    if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
      setPage(pageNum);
      setJumpValue('');
    } else {
      setJumpValue('');
    }
  };

  // Calculate classes based on props
  const containerClasses = cn(
    'flex flex-wrap items-center gap-2',
    {
      'justify-start': align === 'left',
      'justify-center': align === 'center',
      'justify-end': align === 'right',
    },
    className,
  );

  const buttonClasses = cn(
    'flex items-center justify-center rounded border text-sm font-medium transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    {
      'h-8 w-8': size === 'sm',
      'h-10 w-10': size === 'md',
      'h-12 w-12': size === 'lg',
    },
  );

  const activeButtonClasses = cn(
    buttonClasses,
    'bg-blue-600 text-white border-blue-600 hover:bg-blue-700',
  );

  const inactiveButtonClasses = cn(
    buttonClasses,
    'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700',
  );

  const disabledButtonClasses = cn(
    buttonClasses,
    'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500 dark:border-gray-600',
  );

  return (
    <div className={containerClasses}>
      {/* Page range display */}
      {showItemRange && totalItems > 0 && (
        <div className="text-sm text-gray-700 dark:text-gray-300 mr-4">
          Showing <span className="font-medium">{pageRange.startItem}</span> to{' '}
          <span className="font-medium">{pageRange.endItem}</span> of{' '}
          <span className="font-medium">{totalItems}</span> results
        </div>
      )}

      {/* Page size selector */}
      {showPageSizeSelector && (
        <div className="flex items-center mr-4">
          <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
            Show:
          </span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className={cn(
              'rounded border-gray-300 text-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300',
              {
                'h-8 text-xs': size === 'sm',
                'h-10': size === 'md',
                'h-12 text-lg': size === 'lg',
              },
            )}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center">
        {/* First page button */}
        <button
          type="button"
          onClick={firstPage}
          disabled={!canPrevPage}
          className={
            canPrevPage ? inactiveButtonClasses : disabledButtonClasses
          }
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous page button */}
        <button
          type="button"
          onClick={prevPage}
          disabled={!canPrevPage}
          className={
            canPrevPage ? inactiveButtonClasses : disabledButtonClasses
          }
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page number buttons */}
        <div className="flex items-center space-x-1 mx-1">
          {pageNumbers.map((pageNum, i) => {
            // Render ellipsis
            if (pageNum < 0) {
              return (
                <span
                  key={`ellipsis-${i}`}
                  className="w-10 text-center text-gray-500 dark:text-gray-400"
                >
                  &hellip;
                </span>
              );
            }

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setPage(pageNum)}
                className={
                  page === pageNum ? activeButtonClasses : inactiveButtonClasses
                }
                aria-current={page === pageNum ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next page button */}
        <button
          type="button"
          onClick={nextPage}
          disabled={!canNextPage}
          className={
            canNextPage ? inactiveButtonClasses : disabledButtonClasses
          }
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last page button */}
        <button
          type="button"
          onClick={lastPage}
          disabled={!canNextPage}
          className={
            canNextPage ? inactiveButtonClasses : disabledButtonClasses
          }
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>

      {/* Page jumper */}
      {showPageJumper && (
        <form onSubmit={handleJumpToPage} className="flex items-center ml-4">
          <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
            Go to:
          </span>
          <input
            type="number"
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            min={1}
            max={totalPages}
            className={cn(
              'w-16 rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300',
              {
                'h-8 text-xs': size === 'sm',
                'h-10': size === 'md',
                'h-12 text-lg': size === 'lg',
              },
            )}
          />
          <button
            type="submit"
            className={cn(
              'ml-2 rounded border border-gray-300 bg-white px-3 py-2 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
              {
                'text-xs py-1': size === 'sm',
                'text-sm': size === 'md',
                'text-base': size === 'lg',
              },
            )}
          >
            Go
          </button>
        </form>
      )}
    </div>
  );
};
