'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  Loader2,
  X,
  ChevronDownSquare,
  ChevronRightSquare,
} from 'lucide-react';
import { Skeleton } from './Skeleton';
import { Input } from './Input';
import { Button } from './Button';
import { Select } from './Select';
import { Badge } from './Badge';

interface Column<T> {
  id: string;
  header: React.ReactNode;
  accessor?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  hidden?: boolean;
  disablePadding?: boolean;
  sticky?: boolean;
  footer?: React.ReactNode | ((data: T[]) => React.ReactNode);
}

export interface TableProps<T extends Record<string, unknown>> {
  /** Data array */
  data: T[];
  /** Column configuration */
  columns: Column<T>[];
  /** Whether the table is in a loading state */
  loading?: boolean;
  /** Whether the table rows are selectable */
  selectable?: boolean;
  /** Called when selection changes */
  onSelectionChange?: (selectedRows: T[]) => void;
  /** Whether rows are expandable */
  expandable?: boolean;
  /** Called when row is expanded */
  onExpand?: (row: T, index: number) => React.ReactNode;
  /** Whether the table has pagination */
  pagination?: boolean;
  /** Current page (controlled) */
  page?: number;
  /** Called when page changes */
  onPageChange?: (page: number) => void;
  /** Items per page */
  itemsPerPage?: number;
  /** Called when items per page changes */
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  /** Total number of items */
  totalItems?: number;
  /** Whether the table is sortable */
  sortable?: boolean;
  /** Current sort field */
  sortField?: string;
  /** Current sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Called when sort changes */
  onSortChange?: (field: string, direction: 'asc' | 'desc') => void;
  /** Whether the table is searchable */
  searchable?: boolean;
  /** Current search query */
  searchQuery?: string;
  /** Called when search query changes */
  onSearchChange?: (query: string) => void;
  /** Placeholder text for search input */
  searchPlaceholder?: string;
  /** Whether the table is filterable */
  filterable?: boolean;
  /** Current filters */
  filters?: Record<string, unknown>;
  /** Called when filters change */
  onFiltersChange?: (filters: Record<string, unknown>) => void;
  /** Whether the table has striped rows */
  striped?: boolean;
  /** Whether the table has hoverable rows */
  hoverable?: boolean;
  /** Whether the table is bordered */
  bordered?: boolean;
  /** Whether the table is compact */
  compact?: boolean;
  /** Whether the table has a sticky header */
  stickyHeader?: boolean;
  /** Whether the table has a sticky first column */
  stickyFirstColumn?: boolean;
  /** The height of the table */
  height?: string | number;
  /** Whether to show a loading overlay */
  loadingOverlay?: boolean;
  /** Whether to show row indices */
  showIndices?: boolean;
  /** Whether the table data is downloadable */
  downloadable?: boolean;
  /** Called when download is requested */
  onDownload?: () => void;
  /** Custom empty state content */
  emptyState?: React.ReactNode;
  /** Custom row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Function to determine row class name */
  getRowClassName?: (row: T, index: number) => string;
  /** Additional class name */
  className?: string;
  /** Additional header class name */
  headerClassName?: string;
  /** Additional body class name */
  bodyClassName?: string;
  /** Additional footer class name */
  footerClassName?: string;
}

/**
 * Advanced table component with pagination, sorting, filtering, and more
 */
export function Table<T extends Record<string, unknown>>({
  data = [],
  columns = [],
  loading = false,
  selectable = false,
  onSelectionChange,
  expandable = false,
  onExpand,
  pagination = false,
  page = 1,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
  totalItems,
  sortable = true,
  sortField,
  sortDirection = 'asc',
  onSortChange,
  searchable = false,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterable = false,
  filters = {},
  onFiltersChange,
  striped = false,
  hoverable = false,
  bordered = false,
  compact = false,
  stickyHeader = false,
  stickyFirstColumn = false,
  height,
  loadingOverlay = false,
  showIndices = false,
  downloadable = false,
  onDownload,
  emptyState,
  onRowClick,
  getRowClassName,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
}: TableProps<T>) {
  // Local state for controlled props when uncontrolled
  const [internalPage, setInternalPage] = useState(page);
  const [internalSortField, setInternalSortField] = useState(sortField);
  const [internalSortDirection, setInternalSortDirection] =
    useState(sortDirection);
  const [internalSearchQuery, setInternalSearchQuery] = useState(searchQuery);
  const [internalFilters, setInternalFilters] = useState(filters);
  const [internalExpandedRows, setInternalExpandedRows] = useState<number[]>(
    [],
  );
  const [internalSelectedRows, setInternalSelectedRows] = useState<number[]>(
    [],
  );
  const [searchInputValue, setSearchInputValue] = useState(searchQuery);

  // Calculate the total number of pages
  const calculatedTotalItems = totalItems || data.length;
  const totalPages = Math.max(
    1,
    Math.ceil(calculatedTotalItems / itemsPerPage),
  );

  // Update local state when props change
  useEffect(() => {
    setInternalPage(page);
  }, [page]);

  useEffect(() => {
    setInternalSortField(sortField);
  }, [sortField]);

  useEffect(() => {
    setInternalSortDirection(sortDirection);
  }, [sortDirection]);

  useEffect(() => {
    setInternalSearchQuery(searchQuery);
    setSearchInputValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setInternalFilters(filters);
  }, [filters]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setInternalPage(newPage);
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  // Handle sort
  const handleSort = (field: string) => {
    let newDirection: 'asc' | 'desc' = 'asc';

    if (internalSortField === field) {
      newDirection = internalSortDirection === 'asc' ? 'desc' : 'asc';
    }

    setInternalSortField(field);
    setInternalSortDirection(newDirection);

    if (onSortChange) {
      onSortChange(field, newDirection);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    setInternalSearchQuery(searchInputValue);

    if (onSearchChange) {
      onSearchChange(searchInputValue);
    }

    // Reset to first page when searching
    handlePageChange(1);
  };

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(e.target.value);

    // If no explicit search button, search on input change
    if (!onSearchChange) {
      setInternalSearchQuery(e.target.value);
      handlePageChange(1);
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchInputValue('');
    setInternalSearchQuery('');

    if (onSearchChange) {
      onSearchChange('');
    }

    // Reset to first page when clearing search
    handlePageChange(1);
  };

  // Handle row expansion
  const toggleRowExpansion = (index: number) => {
    setInternalExpandedRows((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // Handle row selection
  const toggleRowSelection = (index: number) => {
    setInternalSelectedRows((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // Handle select all rows
  const toggleSelectAll = () => {
    if (internalSelectedRows.length === data.length) {
      setInternalSelectedRows([]);
    } else {
      setInternalSelectedRows(data.map((_, i) => i));
    }
  };

  // Update selection when internalSelectedRows changes
  useEffect(() => {
    if (onSelectionChange) {
      const selectedData = internalSelectedRows.map((index) => data[index]);
      onSelectionChange(selectedData);
    }
  }, [internalSelectedRows, data, onSelectionChange]);

  // Calculate visible data for the current page
  const visibleData = pagination
    ? data.slice((internalPage - 1) * itemsPerPage, internalPage * itemsPerPage)
    : data;

  // Generate table class names
  const tableClasses = cn(
    'w-full text-sm',
    {
      'border-collapse': !bordered,
      'border-separate border-spacing-0': bordered,
      'border border-gray-200 dark:border-gray-700': bordered,
    },
    className,
  );

  const headerClasses = cn(
    'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium',
    {
      'sticky top-0 z-10': stickyHeader,
    },
    headerClassName,
  );

  const bodyClasses = cn('text-gray-700 dark:text-gray-300', bodyClassName);

  const footerClasses = cn(
    'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    footerClassName,
  );

  const cellClasses = (column: Column<T>) =>
    cn(
      'px-4 py-2 border-b border-gray-200 dark:border-gray-700',
      {
        'text-left': column.align === 'left' || !column.align,
        'text-center': column.align === 'center',
        'text-right': column.align === 'right',
        'p-0': column.disablePadding,
        'sticky left-0 z-20 bg-white dark:bg-gray-900':
          column.sticky || (stickyFirstColumn && columns.indexOf(column) === 0),
      },
      column.cellClassName,
    );

  const headerCellClasses = (column: Column<T>) =>
    cn(
      'px-4 py-3 border-b border-gray-200 dark:border-gray-700',
      {
        'text-left': column.align === 'left' || !column.align,
        'text-center': column.align === 'center',
        'text-right': column.align === 'right',
        'p-0': column.disablePadding,
        'sticky left-0 z-30 bg-gray-50 dark:bg-gray-800':
          column.sticky || (stickyFirstColumn && columns.indexOf(column) === 0),
      },
      column.headerClassName,
    );

  const rowClasses = (row: T, index: number) =>
    cn(
      {
        'bg-gray-50 dark:bg-gray-800/50': striped && index % 2 === 1,
        'hover:bg-gray-100 dark:hover:bg-gray-700/50': hoverable,
        'cursor-pointer': hoverable || expandable || onRowClick,
      },
      getRowClassName?.(row, index),
    );

  // Empty state content
  const renderEmptyState = () => {
    if (emptyState) return emptyState;

    return (
      <div className="p-8 text-center">
        <div className="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-500 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          No data found
        </h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {searchQuery
            ? 'No results match your search criteria. Try adjusting your search or filters.'
            : 'There is no data available to display.'}
        </p>
      </div>
    );
  };

  // Loading overlay
  const renderLoadingOverlay = () => {
    if (!loadingOverlay) return null;

    return (
      <div className="absolute inset-0 bg-white/75 dark:bg-gray-900/75 flex items-center justify-center z-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-gray-700 dark:text-gray-300">Loading data...</p>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading && data.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        {searchable && (
          <div className="flex space-x-2">
            <div className="w-full max-w-md">
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-20" />
          </div>
        )}

        <div className="relative rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className={tableClasses}>
              <thead className={headerClasses}>
                <tr>
                  {expandable && (
                    <th className="w-10 px-4 py-3 border-b border-gray-200 dark:border-gray-700"></th>
                  )}
                  {selectable && (
                    <th className="w-10 px-4 py-3 border-b border-gray-200 dark:border-gray-700"></th>
                  )}
                  {showIndices && (
                    <th className="w-10 px-4 py-3 border-b border-gray-200 dark:border-gray-700"></th>
                  )}

                  {columns
                    .filter((col) => !col.hidden)
                    .map((column, index) => (
                      <th
                        key={column.id}
                        className={headerCellClasses(column)}
                        style={{
                          width: column.width,
                          minWidth: column.minWidth,
                          maxWidth: column.maxWidth,
                        }}
                      >
                        <Skeleton className="h-6 w-24" />
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className={bodyClasses}>
                {Array.from({ length: 5 }).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {expandable && (
                      <td className="w-10 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <Skeleton className="h-5 w-5" />
                      </td>
                    )}

                    {selectable && (
                      <td className="w-10 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <Skeleton className="h-5 w-5" />
                      </td>
                    )}

                    {showIndices && (
                      <td className="w-10 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <Skeleton className="h-5 w-5" />
                      </td>
                    )}

                    {columns
                      .filter((col) => !col.hidden)
                      .map((column, colIndex) => (
                        <td
                          key={column.id + colIndex}
                          className={cellClasses(column)}
                        >
                          <Skeleton className="h-5 w-full" />
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {pagination && (
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48" />
            </div>
            <div>
              <Skeleton className="h-8 w-36" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Table actions */}
      {(searchable || filterable || downloadable) && (
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Search */}
          {searchable && (
            <div className="flex-1 min-w-[200px]">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <Input
                    type="search"
                    placeholder={searchPlaceholder}
                    value={searchInputValue}
                    onChange={handleSearchInputChange}
                    className="pl-10 pr-10 w-full"
                  />
                  {searchInputValue && (
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={handleClearSearch}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                {onSearchChange && (
                  <Button type="submit" variant="outline" size="sm">
                    Search
                  </Button>
                )}
              </form>
            </div>
          )}

          {/* Filters */}
          {filterable && (
            <div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter size={16} />}
              >
                Filters
              </Button>
            </div>
          )}

          {/* Download */}
          {downloadable && (
            <div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download size={16} />}
                onClick={onDownload}
              >
                Export
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Table container */}
      <div className="relative rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Loading overlay */}
        {loading && loadingOverlay && renderLoadingOverlay()}

        {/* Table */}
        <div className="overflow-x-auto" style={{ height }}>
          <table className={tableClasses}>
            <thead className={headerClasses}>
              <tr>
                {/* Expand column */}
                {expandable && (
                  <th className="w-10 px-4 py-3 border-b border-gray-200 dark:border-gray-700"></th>
                )}

                {/* Select column */}
                {selectable && (
                  <th className="w-10 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      checked={
                        internalSelectedRows.length === data.length &&
                        data.length > 0
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}

                {/* Index column */}
                {showIndices && (
                  <th className="w-10 px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-gray-500 font-medium">
                    #
                  </th>
                )}

                {/* Column headers */}
                {columns
                  .filter((col) => !col.hidden)
                  .map((column, index) => (
                    <th
                      key={column.id}
                      className={headerCellClasses(column)}
                      style={{
                        width: column.width,
                        minWidth: column.minWidth,
                        maxWidth: column.maxWidth,
                      }}
                    >
                      {sortable && column.sortable !== false ? (
                        <button
                          className="flex items-center space-x-1 font-medium w-full"
                          onClick={() => handleSort(column.id)}
                        >
                          <span>{column.header}</span>
                          <span className="flex items-center ml-1">
                            {internalSortField === column.id ? (
                              internalSortDirection === 'asc' ? (
                                <SortAsc size={16} className="text-blue-500" />
                              ) : (
                                <SortDesc size={16} className="text-blue-500" />
                              )
                            ) : (
                              <SortAsc
                                size={16}
                                className="text-gray-300 dark:text-gray-600"
                              />
                            )}
                          </span>
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody className={bodyClasses}>
              {visibleData.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      columns.filter((col) => !col.hidden).length +
                      (expandable ? 1 : 0) +
                      (selectable ? 1 : 0) +
                      (showIndices ? 1 : 0)
                    }
                    className="px-4 py-8 border-b border-gray-200 dark:border-gray-700"
                  >
                    {renderEmptyState()}
                  </td>
                </tr>
              ) : (
                visibleData.map((row, rowIndex) => {
                  const actualIndex = pagination
                    ? (internalPage - 1) * itemsPerPage + rowIndex
                    : rowIndex;
                  const isExpanded = internalExpandedRows.includes(actualIndex);
                  const isSelected = internalSelectedRows.includes(actualIndex);

                  return (
                    <React.Fragment key={actualIndex}>
                      <tr
                        className={rowClasses(row, actualIndex)}
                        onClick={() => {
                          if (onRowClick) {
                            onRowClick(row, actualIndex);
                          }
                        }}
                      >
                        {/* Expand control */}
                        {expandable && (
                          <td className="w-10 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowExpansion(actualIndex);
                              }}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              {isExpanded ? (
                                <ChevronDownSquare size={18} />
                              ) : (
                                <ChevronRightSquare size={18} />
                              )}
                            </button>
                          </td>
                        )}

                        {/* Select checkbox */}
                        {selectable && (
                          <td className="w-10 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleRowSelection(actualIndex);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                        )}

                        {/* Row index */}
                        {showIndices && (
                          <td className="w-10 px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-gray-500">
                            {actualIndex + 1}
                          </td>
                        )}

                        {/* Row cells */}
                        {columns
                          .filter((col) => !col.hidden)
                          .map((column) => {
                            let cellContent: React.ReactNode;

                            if (column.cell) {
                              cellContent = column.cell(row, actualIndex);
                            } else if (column.accessor) {
                              cellContent = row[column.accessor];
                            } else {
                              cellContent = null;
                            }

                            return (
                              <td
                                key={column.id}
                                className={cellClasses(column)}
                                style={{
                                  width: column.width,
                                  minWidth: column.minWidth,
                                  maxWidth: column.maxWidth,
                                }}
                              >
                                {cellContent}
                              </td>
                            );
                          })}
                      </tr>

                      {/* Expanded row content */}
                      {expandable && isExpanded && onExpand && (
                        <tr>
                          <td
                            colSpan={
                              columns.filter((col) => !col.hidden).length +
                              (expandable ? 1 : 0) +
                              (selectable ? 1 : 0) +
                              (showIndices ? 1 : 0)
                            }
                            className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30"
                          >
                            <AnimatePresence>
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                {onExpand(row, actualIndex)}
                              </motion.div>
                            </AnimatePresence>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>

            {/* Footer */}
            {columns.some((col) => col.footer) && (
              <tfoot className={footerClasses}>
                <tr>
                  {expandable && (
                    <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700"></td>
                  )}
                  {selectable && (
                    <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700"></td>
                  )}
                  {showIndices && (
                    <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700"></td>
                  )}

                  {columns
                    .filter((col) => !col.hidden)
                    .map((column) => {
                      let footerContent: React.ReactNode;

                      if (typeof column.footer === 'function') {
                        footerContent = column.footer(data);
                      } else {
                        footerContent = column.footer;
                      }

                      return (
                        <td
                          key={column.id}
                          className={cn(
                            'px-4 py-2 border-t border-gray-200 dark:border-gray-700',
                            {
                              'text-left':
                                column.align === 'left' || !column.align,
                              'text-center': column.align === 'center',
                              'text-right': column.align === 'right',
                            },
                          )}
                          style={{
                            width: column.width,
                            minWidth: column.minWidth,
                            maxWidth: column.maxWidth,
                          }}
                        >
                          {footerContent}
                        </td>
                      );
                    })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {(internalPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(internalPage * itemsPerPage, calculatedTotalItems)} of{' '}
            {calculatedTotalItems} entries
          </div>

          <div className="flex items-center space-x-2">
            {/* Page size selector */}
            {onItemsPerPageChange && (
              <div className="flex items-center space-x-2 mr-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Rows per page:
                </span>
                <Select
                  value={itemsPerPage.toString()}
                  onChange={(e) => {
                    const newItemsPerPage = parseInt(e.target.value, 10);
                    if (onItemsPerPageChange) {
                      onItemsPerPageChange(newItemsPerPage);
                    }

                    // Adjust current page if needed
                    const newTotalPages = Math.ceil(
                      calculatedTotalItems / newItemsPerPage,
                    );
                    if (internalPage > newTotalPages) {
                      handlePageChange(newTotalPages);
                    }
                  }}
                  className="w-16 h-8 text-sm"
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Pagination controls */}
            <nav className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="outline"
                className={cn('px-2', {
                  'opacity-50 cursor-not-allowed': internalPage === 1,
                })}
                onClick={() => handlePageChange(1)}
                disabled={internalPage === 1}
              >
                <span className="sr-only">First Page</span>
                <span className="flex items-center">
                  <ChevronLeft size={14} />
                  <ChevronLeft size={14} className="-ml-1" />
                </span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                className={cn('px-2', {
                  'opacity-50 cursor-not-allowed': internalPage === 1,
                })}
                onClick={() => handlePageChange(internalPage - 1)}
                disabled={internalPage === 1}
              >
                <span className="sr-only">Previous Page</span>
                <ChevronLeft size={16} />
              </Button>

              {/* Page buttons - show max 5 page buttons */}
              {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                let pageNum: number;

                // Different logic based on current page to keep it centered when possible
                if (totalPages <= 5) {
                  pageNum = idx + 1;
                } else if (internalPage <= 3) {
                  pageNum = idx + 1;
                } else if (internalPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + idx;
                } else {
                  pageNum = internalPage - 2 + idx;
                }

                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={internalPage === pageNum ? 'default' : 'outline'}
                    className="w-8 h-8"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                size="sm"
                variant="outline"
                className={cn('px-2', {
                  'opacity-50 cursor-not-allowed': internalPage === totalPages,
                })}
                onClick={() => handlePageChange(internalPage + 1)}
                disabled={internalPage === totalPages}
              >
                <span className="sr-only">Next Page</span>
                <ChevronRight size={16} />
              </Button>

              <Button
                size="sm"
                variant="outline"
                className={cn('px-2', {
                  'opacity-50 cursor-not-allowed': internalPage === totalPages,
                })}
                onClick={() => handlePageChange(totalPages)}
                disabled={internalPage === totalPages}
              >
                <span className="sr-only">Last Page</span>
                <span className="flex items-center">
                  <ChevronRight size={14} />
                  <ChevronRight size={14} className="-ml-1" />
                </span>
              </Button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
