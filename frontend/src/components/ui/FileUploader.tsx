// frontend/src/components/ui/FileUploader.tsx
'use client';

import React, { useState, useRef, forwardRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Loader2,
  X,
  Upload,
  File,
  Image,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { formatFileSize } from '@/utils/format';

export interface FileUploaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrop'> {
  /** Called when files are selected */
  onFilesSelected: (files: File[]) => void;
  /** Whether multiple files can be selected */
  multiple?: boolean;
  /** Accepted file types (e.g. 'image/*', '.pdf') */
  accept?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Maximum number of files */
  maxFiles?: number;
  /** Whether the uploader is in a loading state */
  loading?: boolean;
  /** Whether the uploader is disabled */
  disabled?: boolean;
  /** Children to render inside the dropzone */
  children?: React.ReactNode;
  /** Error message to display */
  error?: string;
  /** Whether to preview images */
  showPreviews?: boolean;
  /** Whether to show file information */
  showFileInfo?: boolean;
  /** Whether to auto-upload files immediately */
  autoUpload?: boolean;
  /** Whether the file selection was successful */
  success?: boolean;
  /** Whether to use the native file input dialog */
  useNativeDialog?: boolean;
  /** Additional class name */
  className?: string;
  /** Height of the dropzone */
  height?: string;
}

/**
 * A file uploader component with drag and drop support
 */
export const FileUploader = forwardRef<HTMLDivElement, FileUploaderProps>(
  (
    {
      onFilesSelected,
      multiple = false,
      accept,
      maxSize,
      maxFiles = 10,
      loading = false,
      disabled = false,
      children,
      error,
      showPreviews = true,
      showFileInfo = true,
      autoUpload = false,
      success = false,
      useNativeDialog = false,
      className,
      height = 'auto',
      ...props
    },
    ref,
  ) => {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    // Corrected the useState declaration to be on a single line
    const [fileErrors, setFileErrors] = useState<
      Array<{ name: string; error: string }>
    >([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cleanup URLs when unmounting
    useEffect(() => {
      return () => {
        files.forEach((file) => {
          if ('preview' in file && typeof file.preview === 'string') {
            URL.revokeObjectURL(file.preview);
          }
        });
      };
    }, [files]);

    // Process files and handle validation
    const processFiles = (fileList: FileList | null) => {
      if (!fileList) return;

      // Convert FileList to array
      const filesArray = Array.from(fileList);

      // Check if too many files
      if (filesArray.length > maxFiles) {
        setFileErrors([
          {
            name: 'Multiple files',
            error: `Maximum ${maxFiles} file${maxFiles === 1 ? ' is' : 's are'} allowed`,
          },
        ]);
        return;
      }

      // Validate files
      const errors: Array<{ name: string; error: string }> = [];
      const validFiles: File[] = [];

      filesArray.forEach((file) => {
        // Validate file type if accept is provided
        if (accept) {
          const acceptedTypes = accept.split(',').map((type) => type.trim());
          const fileType = file.type;
          const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;

          const isAccepted = acceptedTypes.some((type) => {
            if (type.startsWith('.')) {
              // Check file extension (e.g. .pdf)
              return fileExtension === type.toLowerCase();
            } else if (type.endsWith('/*')) {
              // Check MIME type group (e.g. image/*)
              const typeGroup = type.split('/')[0];
              return fileType.startsWith(`${typeGroup}/`);
            } else {
              // Check exact MIME type (e.g. image/png)
              return fileType === type;
            }
          });

          if (!isAccepted) {
            errors.push({
              name: file.name,
              error: `File type not accepted`,
            });
            return;
          }
        }

        // Check file size
        if (maxSize && file.size > maxSize) {
          errors.push({
            name: file.name,
            error: `File exceeds size limit of ${formatFileSize(maxSize)}`,
          });
          return;
        }

        // Add preview URLs for images
        if (file.type.startsWith('image/') && showPreviews) {
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          });
        }

        validFiles.push(file);
      });

      // Set errors or update files
      if (errors.length > 0) {
        setFileErrors(errors);
      } else {
        setFileErrors([]);

        // In single file mode, replace the file
        // In multiple file mode, add to existing files
        const newFiles = multiple ? [...files, ...validFiles] : validFiles;

        setFiles(newFiles);
        onFilesSelected(newFiles);
      }
    };

    // Handle file input change
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      // Reset the input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    // Handle file drop
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled || loading) return;

      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    };

    // Handle drag events
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled || loading) return;

      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(false);
    };

    // Open the file dialog
    const openFileDialog = () => {
      if (disabled || loading) return;
      fileInputRef.current?.click();
    };

    // Remove a file
    const removeFile = (index: number) => {
      const newFiles = [...files];
      const fileToRemove = newFiles[index];

      // Revoke the preview URL
      if (
        'preview' in fileToRemove &&
        typeof fileToRemove.preview === 'string'
      ) {
        URL.revokeObjectURL(fileToRemove.preview);
      }

      newFiles.splice(index, 1);
      setFiles(newFiles);
      onFilesSelected(newFiles);
    };

    // Remove all files
    const clearFiles = () => {
      // Revoke all preview URLs
      files.forEach((file) => {
        if ('preview' in file && typeof file.preview === 'string') {
          URL.revokeObjectURL(file.preview);
        }
      });

      setFiles([]);
      onFilesSelected([]);
    };

    // Get the icon for a file based on its type
    const getFileIcon = (file: File) => {
      if (file.type.startsWith('image/')) {
        return <Image size={20} />;
      }

      return <File size={20} />;
    };

    // Get a class name based on the file type
    const getFileIconColorClass = (file: File) => {
      if (file.type.startsWith('image/')) {
        return 'text-blue-500 dark:text-blue-400';
      } else if (file.type.includes('pdf')) {
        return 'text-red-500 dark:text-red-400';
      } else if (file.type.includes('word') || file.type.includes('document')) {
        return 'text-blue-600 dark:text-blue-400';
      } else if (
        file.type.includes('excel') ||
        file.type.includes('spreadsheet')
      ) {
        return 'text-green-600 dark:text-green-400';
      } else if (file.type.includes('video')) {
        return 'text-purple-500 dark:text-purple-400';
      } else if (file.type.includes('audio')) {
        return 'text-pink-500 dark:text-pink-400';
      }

      return 'text-gray-500 dark:text-gray-400';
    };

    // Generate class names for the dropzone
    const dropzoneClasses = cn(
      'border-2 border-dashed rounded-lg transition-colors duration-150 flex items-center justify-center cursor-pointer overflow-hidden',
      {
        'border-blue-500 bg-blue-50 dark:bg-blue-900/20': isDragging,
        'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50':
          !isDragging && !disabled && !loading,
        'border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 cursor-not-allowed':
          disabled,
        'border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-900/20':
          !!error,
        'border-green-300 dark:border-green-900 bg-green-50 dark:bg-green-900/20':
          success && !error,
      },
      className,
    );

    return (
      <div className="space-y-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={accept}
          onChange={handleFileInputChange}
          disabled={disabled || loading}
        />

        {/* Dropzone */}
        <div
          ref={ref}
          className={dropzoneClasses}
          onClick={openFileDialog}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{ height }}
          {...props}
        >
          {children || (
            <div className="flex flex-col items-center p-6 text-center">
              {loading ? (
                <Loader2
                  size={36}
                  className="text-blue-500 animate-spin mb-3"
                />
              ) : error ? (
                <AlertCircle size={36} className="text-red-500 mb-3" />
              ) : success && files.length > 0 ? (
                <CheckCircle size={36} className="text-green-500 mb-3" />
              ) : (
                <Upload size={36} className="text-gray-400 mb-3" />
              )}

              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {loading
                  ? 'Uploading files...'
                  : error
                    ? 'Upload error'
                    : success && files.length > 0
                      ? 'Upload complete'
                      : 'Drag & drop files here, or click to browse'}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {accept && `Accepted file types: ${accept}`}
                {maxSize &&
                  (accept ? ' • ' : '') +
                    `Max size: ${formatFileSize(maxSize)}`}
                {maxFiles > 1 &&
                  (accept || maxSize ? ' • ' : '') + `Max files: ${maxFiles}`}
              </p>

              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* File errors */}
        <AnimatePresence>
          {fileErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3"
            >
              <div className="flex items-start">
                <AlertCircle
                  size={16}
                  className="text-red-500 dark:text-red-400 mt-0.5 mr-2"
                />
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-300">
                    File validation errors
                  </h4>
                  <ul className="mt-1 text-xs text-red-700 dark:text-red-300 space-y-1">
                    {fileErrors.map((error, i) => (
                      <li key={i}>
                        {error.name}: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File previews */}
        {showPreviews && files.length > 0 && (
          <div className="mt-2 space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {files.length} {files.length === 1 ? 'file' : 'files'} selected
              </h4>

              {files.length > 0 && (
                <button
                  type="button"
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFiles();
                  }}
                >
                  Remove all
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {files.map((file, i) => (
                <motion.div
                  key={`${file.name}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="group relative bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden"
                >
                  {/* Image preview for image files */}
                  {'preview' in file && typeof file.preview === 'string' ? (
                    <div className="aspect-square relative">
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Overlay with file info on hover */}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-white text-center p-2">
                          <p className="text-xs truncate max-w-[150px]">
                            {file.name}
                          </p>
                          <p className="text-xs opacity-80">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Generic file preview
                    <div className="aspect-square flex flex-col items-center justify-center p-4">
                      <div className={cn('mb-2', getFileIconColorClass(file))}>
                        {getFileIcon(file)}
                      </div>

                      {showFileInfo && (
                        <>
                          <p className="text-xs font-medium text-gray-900 dark:text-white text-center truncate w-full">
                            {file.name.length > 15
                              ? file.name.substring(0, 15) + '...'
                              : file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatFileSize(file.size)}
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
);

FileUploader.displayName = 'FileUploader';
