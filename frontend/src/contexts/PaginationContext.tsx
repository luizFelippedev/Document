// src/contexts/PaginationContext.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SETTINGS } from '@/config/constants';

interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface PaginationContextType extends PaginationState {
  // Actions
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  setTotalItems: (count: number) => void;
  
  // Computed values
  canNextPage: boolean;
  canPrevPage: boolean;
  pageNumbers: number[];
  pageRange: { startItem: number; endItem: number };
  
  // Utility functions
  paginateArray: <T>(array: T[]) => T[];
  getPaginationProps: () => {
    pageSize: number;
    page: number;
    totalItems: number;
    totalPages: number;
  };
}

interface PaginationProviderProps {
  children: ReactNode;
  initialPage?: number;
  initialPageSize?: number;
  pageParam?: string;
  pageSizeParam?: string;
  siblingCount?: number;
  useUrlParams?: boolean;
  contentType?: 'projects' | 'certificates' | 'other';
}

export const PaginationContext = createContext<PaginationContextType | undefined>(undefined);

export const PaginationProvider: React.FC<PaginationProviderProps> = ({
  children,
  initialPage = 1,
  initialPageSize,
  pageParam = 'page',
  pageSizeParam = 'pageSize',
  siblingCount = 1,
  useUrlParams = true,
  contentType = 'other',
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Determine initial page size based on content type if not explicitly provided
  const defaultPageSize = contentType === 'projects' 
    ? SETTINGS.projectsPerPage 
    : contentType === 'certificates' 
      ? SETTINGS.certificatesPerPage 
      : 10;
  
  // Get initial values from URL if applicable
  const getInitialValue = useCallback(
    (param: string, defaultValue: number): number => {
      if (!useUrlParams) return defaultValue;
      const value = searchParams.get(param);
      const parsed = value ? parseInt(value, 10) : defaultValue;
      return isNaN(parsed) ? defaultValue : parsed;
    },
    [useUrlParams, searchParams]
  );
  
  // State
  const [page, setPageInternal] = useState(() => getInitialValue(pageParam, initialPage));
  const [pageSize, setPageSizeInternal] = useState(() => 
    getInitialValue(pageSizeParam, initialPageSize || defaultPageSize)
  );
  const [totalItems, setTotalItems] = useState(0);
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Update URL params if needed
  const updateUrlParams = useCallback(
    (newPage: number, newPageSize: number) => {
      if (!useUrlParams) return;
      
      const params = new URLSearchParams(searchParams.toString());
      
      params.set(pageParam, newPage.toString());
      params.set(pageSizeParam, newPageSize.toString());
      
      // Preserve existing query params
      const query = params.toString();
      const url = `${pathname}${query ? `?${query}` : ''}`;
      
      router.push(url);
    },
    [useUrlParams, pathname, router, searchParams, pageParam, pageSizeParam]
  );
  
  // Action handlers
  const setPage = useCallback(
    (newPage: number) => {
      const validPage = Math.min(Math.max(1, newPage), totalPages || 1);
      setPageInternal(validPage);
      updateUrlParams(validPage, pageSize);
    },
    [pageSize, totalPages, updateUrlParams]
  );
  
  const setPageSize = useCallback(
    (newSize: number) => {
      const validSize = Math.max(1, newSize);
      setPageSizeInternal(validSize);
      
      // When changing page size, adjust current page if needed
      const newTotalPages = Math.ceil(totalItems / validSize);
      const newPage = Math.min(page, newTotalPages || 1);
      
      setPageInternal(newPage);
      updateUrlParams(newPage, validSize);
    },
    [page, totalItems, updateUrlParams]
  );
  
  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }, [page, totalPages, setPage]);
  
  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page, setPage]);
  
  const firstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);
  
  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [setPage, totalPages]);
  
  // Computed values
  const canNextPage = page < totalPages;
  const canPrevPage = page > 1;
  
  const pageRange = useMemo(() => {
    const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const endItem = Math.min(startItem + pageSize - 1, totalItems);
    return { startItem, endItem };
  }, [page, pageSize, totalItems]);
  
  // Generate page numbers array with ellipsis
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      // If we have 7 or fewer pages, show all
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Calculate range with ellipsis
    const leftSiblingIndex = Math.max(page - siblingCount, 1);
    const rightSiblingIndex = Math.min(page + siblingCount, totalPages);
    
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;
    
    // Always include first and last page
    if (shouldShowLeftDots && shouldShowRightDots) {
      // Something like: 1 ... 4 5 6 ... 10
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [1, -1, ...middleRange, -2, totalPages];
    }
    
    if (!shouldShowLeftDots && shouldShowRightDots) {
      // Something like: 1 2 3 4 5 ... 10
      const leftRange = Array.from({ length: 5 }, (_, i) => i + 1);
      return [...leftRange, -2, totalPages];
    }
    
    if (shouldShowLeftDots && !shouldShowRightDots) {
      // Something like: 1 ... 6 7 8 9 10
      const rightRange = Array.from(
        { length: 5 },
        (_, i) => totalPages - 4 + i
      );
      return [1, -1, ...rightRange];
    }
    
    // This should never happen, but just in case
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [page, totalPages, siblingCount]);
  
  // Utility function to paginate an array
  const paginateArray = useCallback(
    <T,>(array: T[]): T[] => {
      const startIndex = (page - 1) * pageSize;
      return array.slice(startIndex, startIndex + pageSize);
    },
    [page, pageSize]
  );
  
  // Get pagination props for table components
  const getPaginationProps = useCallback(() => {
    return {
      page,
      pageSize,
      totalItems,
      totalPages,
    };
  }, [page, pageSize, totalItems, totalPages]);
  
  const value = {
    // State
    page,
    pageSize,
    totalItems,
    totalPages,
    
    // Actions
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setTotalItems,
    
    // Computed values
    canNextPage,
    canPrevPage,
    pageNumbers,
    pageRange,
    
    // Utility functions
    paginateArray,
    getPaginationProps,
  };
  
  return (
    <PaginationContext.Provider value={value}>
      {children}
    </PaginationContext.Provider>
  );
};

export const usePagination = () => {
  const context = useContext(PaginationContext);
  
  if (!context) {
    throw new Error('usePagination must be used within a PaginationProvider');
  }
  
  return context;
};