// frontend/src/components/ui/Modal.tsx
'use client';

import React, { Fragment, ReactNode, useRef, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
  closeOnClickOutside?: boolean;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  centered = false,
  closeOnClickOutside = true,
  showCloseButton = true,
  className,
  contentClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
}: ModalProps) => {
  const initialFocusRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);
  
  // Handle closing animation
  const handleClose = () => {
    setIsClosing(true);
    const timeout = setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200); // Match this with the transition duration
    
    return () => clearTimeout(timeout);
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full mx-4',
  };
  
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        initialFocus={initialFocusRef}
        onClose={closeOnClickOutside ? handleClose : () => {}}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-60 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className={cn(
            "flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0",
            centered ? "items-center" : "items-end sm:items-center"
          )}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                className={cn(
                  "relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all w-full",
                  "sm:my-8",
                  sizeClasses[size],
                  className
                )}
              >
                <div 
                  className={cn(
                    "bg-white dark:bg-gray-800",
                    contentClassName
                  )}
                >
                  {/* Header */}
                  {(title || showCloseButton) && (
                    <div className={cn(
                      "flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700",
                      headerClassName
                    )}>
                      <div>
                        {title && (
                          <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 dark:text-white">
                            {title}
                          </Dialog.Title>
                        )}
                        {description && (
                          <Dialog.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {description}
                          </Dialog.Description>
                        )}
                      </div>
                      
                      {showCloseButton && (
                        <button
                          type="button"
                          className="rounded-md bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                          onClick={handleClose}
                          ref={initialFocusRef}
                        >
                          <span className="sr-only">Close</span>
                          <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Body */}
                  <div className={cn(
                    "px-6 py-4", 
                    !title && !showCloseButton && "pt-6",
                    !footer && "pb-6",
                    bodyClassName
                  )}>
                    {children}
                  </div>
                  
                  {/* Footer */}
                  {footer && (
                    <div className={cn(
                      "px-6 py-4 border-t border-gray-200 dark:border-gray-700",
                      footerClassName
                    )}>
                      {footer}
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

// Confirmation Modal
export interface ConfirmModalProps extends Omit<ModalProps, 'title' | 'children' | 'footer'> {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'warning' | 'success';
  onConfirm: () => void;
  icon?: ReactNode;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  icon,
  ...props
}: ConfirmModalProps) => {
  const buttonStyleMap = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      {...props}
    >
      <div className="flex flex-col items-center text-center">
        {icon && (
          <div className="mb-4">
            {icon}
          </div>
        )}
        <p className="text-gray-700 dark:text-gray-300">{message}</p>
      </div>
      
      <div className="mt-6 flex justify-center space-x-3">
        <button
          type="button"
          className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium"
          onClick={onClose}
        >
          {cancelText}
        </button>
        <button
          type="button"
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium",
            buttonStyleMap[confirmVariant]
          )}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};