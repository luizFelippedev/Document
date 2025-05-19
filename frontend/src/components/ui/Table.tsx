// frontend/src/components/ui/Table.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Button } from './Button';
import { Pagination } from './Pagination';
import { Input } from './Input';
import { Select } from './Select';
import { ChevronDown, ChevronUp, Search, Loader2, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
  id: string;
  header: string | React.ReactNode;
  accessor?: keyof T | ((row: T) => any);
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  minWidth?: string;
  maxWidth?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: boolean;
  itemsPerPage?: number;
  sortable?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  noDataMessage?: string;
  renderRowActions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: (row: T, index: number) => string;
  cellClassName?: (column: Column<T>, row: T) => string;
}

export function Table<T extends { id?: string | number } = any>({
  data,
  columns,
  loading = false,
  pagination = true,
  itemsPerPage = 10,
  sortable = true,
  striped = true,
  hoverable = true,
  bordered = true,
  searchable = false,
  searchPlaceholder = 'Search...',
  noDataMessage = 'No data available',
  renderRowActions,
  onRowClick,
  className,
  tableClassName,
  headerClassName,
  bodyClassName,
  rowClassName,
  cellClassName,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortedData, setSortedData] = useState<T[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(itemsPerPage);
  
  // Initial data setup and handle data changes
  useEffect(() => {
    setSortedData(data);
  }, [data]);
  
  // Handle search
  useEffect(() => {
    if (!searchTerm) {
      setSortedData(data);
      return;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    const filteredData = data.filter(row => {
      // Check all columns with accessors
      return columns.some(column => {
        if (!column.accessor) return false;
        
        let value;
        if (typeof column.accessor === 'function') {
          value = column.accessor(row);
        } else {
          value = row[column.accessor];
        }
        
        return typeof value === 'string' 
          ? value.toLowerCase().includes(lowerSearchTerm)
          : typeof value === 'number'
          ? value.toString().includes(lowerSearchTerm)
          : false;
      });
    });
    
    setSortedData(filteredData);
    setCurrentPage(1);
  }, [searchTerm, data, columns]);
  
  // Handle sorting
  const handleSort = (columnId: string) => {
    if (!sortable) return;
    
    const column = columns.find(col => col.id === columnId);
    if (!column || column.sortable === false) return;
    
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortColumn === columnId) {
      if (sortDirection === 'asc') {
        direction = 'desc';
      } else if (sortDirection === 'desc') {
        direction = null;
      }
    }
    
    setSortColumn(direction === null ? null : columnId);
    setSortDirection(direction);
    
    if (direction === null) {
      setSortedData(data);
      return;
    }
    
    const sorted = [...sortedData].sort((a, b) => {
      const aValue = getColumnValue(a, column);
      const bValue = getColumnValue(b, column);
      
      if (aValue === null || aValue === undefined) return direction === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return direction === 'asc' ? 1 : -1;
      
      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return direction === 'asc'
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });
    
    setSortedData(sorted);
  };
  
  // Get column value
  const getColumnValue = (row: T, column: Column<T>) => {
    if (!column.accessor) return null;
    
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    
    return row[column.accessor];
  };
  
  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    const newSize = parseInt(value, 10);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page
  };
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Table controls */}
      {(searchable || pagination) && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
          {searchable && (
            <div className="w-full sm:w-64">
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                leftElement={<Search size={18} />}
                variant="filled"
              />
            </div>
          )}
          
          {pagination && (
            <div className="flex items-center space-x-2">
              <Select
                value={pageSize.toString()}
                onChange={handlePageSizeChange}
                options={[
                  { value: '5', label: '5 per page' },
                  { value: '10', label: '10 per page' },
                  { value: '25', label: '25 per page' },
                  { value: '50', label: '50 per page' },
                  { value: '100', label: '100 per page' },
                ]}
                variant="filled"
                size="sm"
              />
            </div>
          )}
        </div>
      )}
      
      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className={cn(
          'w-full',
          'divide-y divide-gray-200 dark:divide-gray-700',
          bordered && 'border border-gray-200 dark:border-gray-700',
          tableClassName
        )}>
          <thead className={cn(
            'bg-gray-50 dark:bg-gray-800',
            headerClassName
          )}>
            <tr>
              {columns.map(column => (
                <th
                  key={column.id}
                  scope="col"
                  className={cn(
                    'px-6 py-3',
                    'text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    sortable && column.sortable !== false && 'cursor-pointer select-none'
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                  }}
                  onClick={() => sortable && column.sortable !== false && handleSort(column.id)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {sortable && column.sortable !== false && (
                      <span className="inline-flex flex-col">
                        {sortColumn === column.id ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp size={14} className="text-blue-600 dark:text-blue-400" />
                          ) : sortDirection === 'desc' ? (
                            <ChevronDown size={14} className="text-blue-600 dark:text-blue-400" />
                          ) : (
                            <ArrowUpDown size={14} className="text-gray-400" />
                          )
                        ) : (
                          <ArrowUpDown size={14} className="text-gray-400" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              
              {renderRowActions && (
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className={cn(
            'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700',
            striped && 'divide-y divide-gray-200 dark:divide-gray-700',
            bodyClassName
          )}>
            {loading ? (
              <tr>
                <td 
                  colSpan={columns.length + (renderRowActions ? 1 : 0)}
                  className="px-6 py-16 text-center text-gray-500 dark:text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-blue-500 mb-2" />
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (renderRowActions ? 1 : 0)}
                  className="px-6 py-16 text-center text-gray-500 dark:text-gray-400"
                >
                  {noDataMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={cn(
                    striped && rowIndex % 2 === 0 ? 'bg-gray-50 dark:bg-gray-750' : 'bg-white dark:bg-gray-800',
                    hoverable && 'hover:bg-gray-100 dark:hover:bg-gray-700',
                    onRowClick && 'cursor-pointer',
                    rowClassName && rowClassName(row, rowIndex)
                  )}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map(column => (
                    <td
                      key={column.id}
                      className={cn(
                        'px-6 py-4 whitespace-nowrap text-sm',
                        'text-gray-900 dark:text-gray-200',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        cellClassName && cellClassName(column, row)
                      )}
                    >
                      {column.cell ? (
                        column.cell(row)
                      ) : column.accessor ? (
                        typeof column.accessor === 'function' 
                          ? column.accessor(row) 
                          : (row[column.accessor] as React.ReactNode)
                      ) : null}
                    </td>
                  ))}
                  
                  {renderRowActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {renderRowActions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing{' '}
            <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
            {' '}-{' '}
            <span className="font-medium">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </span>
            {' '}of{' '}
            <span className="font-medium">{sortedData.length}</span>
            {' '}results
          </div>
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}