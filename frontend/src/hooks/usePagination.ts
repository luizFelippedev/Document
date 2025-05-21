// src/hooks/usePagination.ts
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalItems: number;
  siblingCount?: number;
  useQueryParams?: boolean;
  pageParam?: string;
  pageSizeParam?: string;
}

interface PaginationResult {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  paginatedData: <T>(data: T[]) => T[];
  pageNumbers: number[];
  startIndex: number;
  endIndex: number;
  visibleItems: number;
}

export const usePagination = ({
  initialPage = 1,
  initialPageSize = 10,
  totalItems,
  siblingCount = 1,
  useQueryParams = false,
  pageParam = 'page',
  pageSizeParam = 'pageSize',
}: UsePaginationOptions): PaginationResult => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from query params if applicable
  const getInitialValue = useCallback(
    (param: string, defaultValue: number) => {
      if (!useQueryParams) return defaultValue;
      const queryValue = searchParams.get(param);
      return queryValue ? parseInt(queryValue, 10) : defaultValue;
    },
    [useQueryParams, searchParams],
  );

  const [currentPage, setCurrentPage] = useState(
    getInitialValue(pageParam, initialPage),
  );
  const [pageSize, setCurrentPageSize] = useState(
    getInitialValue(pageSizeParam, initialPageSize),
  );

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Ensure current page is within bounds
  const normalizedCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Navigation state
  const canGoPrevious = normalizedCurrentPage > 1;
  const canGoNext = normalizedCurrentPage < totalPages;

  // Set page with navigation update if using query params
  const setPage = useCallback(
    (page: number) => {
      const validPage = Math.min(Math.max(1, page), totalPages);
      setCurrentPage(validPage);

      if (useQueryParams) {
        const params = new URLSearchParams(searchParams.toString());
        params.set(pageParam, validPage.toString());
        router.push(`?${params.toString()}`);
      }
    },
    [totalPages, useQueryParams, searchParams, pageParam, router],
  );

  // Set page size with navigation update if using query params
  const setPageSize = useCallback(
    (size: number) => {
      const validSize = Math.max(1, size);
      setCurrentPageSize(validSize);

      // When changing page size, we need to adjust the current page
      // to ensure we're showing relevant items
      const newTotalPages = Math.ceil(totalItems / validSize);
      const newPage = Math.min(currentPage, newTotalPages);

      if (useQueryParams) {
        const params = new URLSearchParams(searchParams.toString());
        params.set(pageSizeParam, validSize.toString());
        params.set(pageParam, newPage.toString());
        router.push(`?${params.toString()}`);
      } else {
        setCurrentPage(newPage);
      }
    },
    [
      totalItems,
      currentPage,
      useQueryParams,
      searchParams,
      pageSizeParam,
      pageParam,
      router,
    ],
  );

  // Navigation methods
  const goToNextPage = useCallback(() => {
    if (canGoNext) {
      setPage(normalizedCurrentPage + 1);
    }
  }, [canGoNext, normalizedCurrentPage, setPage]);

  const goToPreviousPage = useCallback(() => {
    if (canGoPrevious) {
      setPage(normalizedCurrentPage - 1);
    }
  }, [canGoPrevious, normalizedCurrentPage, setPage]);

  const goToFirstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const goToLastPage = useCallback(() => {
    setPage(totalPages);
  }, [setPage, totalPages]);

  // Calculate start and end indices
  const startIndex = (normalizedCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);
  const visibleItems = endIndex - startIndex + 1;

  // Get paginated data from array
  const paginatedData = useCallback(
    <T>(data: T[]): T[] => {
      return data.slice(startIndex, endIndex + 1);
    },
    [startIndex, endIndex],
  );

  // Generate array of page numbers to display
  const pageNumbers = useMemo(() => {
    // Create array of all page numbers
    const numbers: number[] = [];

    // Always include first page
    numbers.push(1);

    // Calculate range around current page
    const rangeStart = Math.max(2, normalizedCurrentPage - siblingCount);
    const rangeEnd = Math.min(
      totalPages - 1,
      normalizedCurrentPage + siblingCount,
    );

    // Add ellipsis before range if needed
    if (rangeStart > 2) {
      numbers.push(-1); // Use -1 to represent ellipsis
    }

    // Add range of pages
    for (let i = rangeStart; i <= rangeEnd; i++) {
      numbers.push(i);
    }

    // Add ellipsis after range if needed
    if (rangeEnd < totalPages - 1) {
      numbers.push(-2); // Use -2 to represent ellipsis (different key than first ellipsis)
    }

    // Always include last page if more than 1 page
    if (totalPages > 1) {
      numbers.push(totalPages);
    }

    return numbers;
  }, [normalizedCurrentPage, totalPages, siblingCount]);

  return {
    currentPage: normalizedCurrentPage,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    canGoPrevious,
    canGoNext,
    paginatedData,
    pageNumbers,
    startIndex,
    endIndex,
    visibleItems,
  };
};
