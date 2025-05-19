// frontend/src/components/ui/FileUploader.tsx
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { UploadCloud, X, File, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { formatFileSize } from '@/utils/format';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  onFileRemoved?: (fileIndex: number) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  showPreview?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  initialFiles?: File[];
  error?: string;
}

export const FileUploader = ({
  onFilesSelected,
  onFileRemoved,
  multiple = false,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept,
  showPreview = true,
  disabled = false,
  className,
  children,
  initialFiles = [],
  error,
}: FileUploaderProps) => {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles || selectedFiles.length === 0) return;
      
      // Convert FileList to Array
      const fileArray = Array.from(selectedFiles);
      
      // Validate file count
      if (multiple) {
        if (files.length + fileArray.length > maxFiles) {
          setFileError(`You can only upload up to ${maxFiles} files`);
          return;
        }
      } else if (fileArray.length > 1) {
        // For single file uploads, just take the first one
        fileArray.splice(1);
      }
      
      // Validate file types if accept is provided
      if (accept) {
        const acceptedTypes = accept.split(',').map(type => type.trim());
        const invalidFiles = fileArray.filter(file => {
          return !acceptedTypes.some(type => {
            // Handle wildcards like image/*
            if (type.endsWith('/*')) {
              const category = type.split('/')[0];
              return file.type.startsWith(`${category}/`);
            }
            return file.type === type;
          });
        });
        
        if (invalidFiles.length > 0) {
          setFileError(`Some files have invalid types. Accepted: ${accept}`);
          return;
        }
      }
      
      // Validate file sizes
      const oversizedFiles = fileArray.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        setFileError(`Some files exceed the maximum size of ${formatFileSize(maxSize)}`);
        return;
      }
      
      // Update files
      const newFiles = multiple ? [...files, ...fileArray] : fileArray;
      setFiles(newFiles);
      setFileError(null);
      
      // Notify parent component
      onFilesSelected(newFiles);
    },
    [accept, files, maxFiles, maxSize, multiple, onFilesSelected]
  );
  
  // Handle file removal
  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    // Notify parent component
    if (onFileRemoved) {
      onFileRemoved(index);
    }
    
    onFilesSelected(newFiles);
    setFileError(null);
  };
  
  // Handle drag events
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(true);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    
    const { files } = e.dataTransfer;
    handleFileChange(files);
  };
  
  // Generate preview for image files
  const getPreviewUrl = (file: File) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };
  
  // Get file icon based on type
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      );
    }
    
    if (file.type === 'application/pdf') {
      return (
        <div className="w-8 h-8 rounded-md bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      );
    }
    
    return (
      <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
        <File size={20} />
      </div>
    );
  };
  
  // Format file name for display
  const getDisplayFileName = (fileName: string, maxLength = 20) => {
    if (fileName.length <= maxLength) return fileName;
    
    const extension = fileName.split('.').pop();
    const name = fileName.substring(0, fileName.length - extension!.length - 1);
    
    if (name.length <= maxLength - 5) return fileName;
    
    return `${name.substring(0, maxLength - 5)}...${extension}`;
  };
  
  return (
    <div className={cn(
      'relative border-2 border-dashed rounded-lg overflow-hidden',
      isDragging ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700',
      disabled && 'opacity-60 cursor-not-allowed',
      'focus-within:border-blue-500 dark:focus-within:border-blue-500',
      className
    )}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={(e) => handleFileChange(e.target.files)}
        className="hidden"
        disabled={disabled}
      />
      
      {/* Drop zone */}
      <div
        className="relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        {/* Default uploader UI or custom children */}
        {files.length === 0 || !showPreview ? (
          children || (
            <div className="p-6 flex flex-col items-center justify-center text-center">
              <UploadCloud className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isDragging ? 'Drop files here' : 'Drag and drop files here'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {multiple 
                  ? `Up to ${maxFiles} files (max ${formatFileSize(maxSize)} each)`
                  : `Max file size: ${formatFileSize(maxSize)}`
                }
                {accept && ` • Accepted: ${accept.replace(/,/g, ', ')}`}
              </p>
              <Button 
                variant="outline"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={disabled}
              >
                Select Files
              </Button>
            </div>
          )
        ) : null}
        
        {/* File previews */}
        {files.length > 0 && showPreview && (
          <div className={cn(
            files.length > 0 && children ? 'border-t border-gray-200 dark:border-gray-700' : '',
            'p-3'
          )}>
            <div className="space-y-2">
              {files.map((file, index) => {
                const previewUrl = getPreviewUrl(file);
                
                return (
                  <div 
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded p-2"
                  >
                    <div className="flex items-center overflow-hidden">
                      {previewUrl ? (
                        <div className="w-10 h-10 rounded-md overflow-hidden mr-3 flex-shrink-0">
                          <img 
                            src={previewUrl} 
                            alt={file.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="mr-3 flex-shrink-0">
                          {getFileIcon(file)}
                        </div>
                      )}
                      
                      <div className="truncate">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {getDisplayFileName(file.name)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                      className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                      disabled={disabled}
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
            
            {multiple && files.length < maxFiles && (
              <div className="mt-3 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={disabled}
                >
                  Add More Files
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Error message */}
      {(error || fileError) && (
        <div className="mt-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center">
            <AlertCircle size={12} className="mr-1 flex-shrink-0" />
            <span>{error || fileError}</span>
          </p>
        </div>
      )}
    </div>
  );
};