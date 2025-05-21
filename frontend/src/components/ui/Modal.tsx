// frontend/src/components/ui/Modal.tsx
"use client";

import { useState, useEffect, Fragment, forwardRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when the modal is closed */
  onClose: () => void;
  /** Modal title */
  title?: React.ReactNode;
  /** Modal content */
  children: React.ReactNode;
  /** Whether to close the modal when clicking outside */
  closeOnOutsideClick?: boolean;
  /** Whether to close the modal when pressing escape */
  closeOnEsc?: boolean;
  /** Whether to center the modal vertically */
  centered?: boolean;
  /** Modal size variant */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Footer content */
  footer?: React.ReactNode;
  /** Additional class name for the modal container */
  containerClassName?: string;
  /** Additional class name for the modal content */
  contentClassName?: string;
  /** Callback fired before the modal opens */
  onBeforeOpen?: () => void;
  /** Callback fired after the modal is fully open */
  onAfterOpen?: () => void;
  /** Callback fired before the modal closes */
  onBeforeClose?: () => void;
  /** Callback fired after the modal is fully closed */
  onAfterClose?: () => void;
  /** Whether to disable scrolling of the background when the modal is open */
  disableScroll?: boolean;
  /** Whether to show a backdrop behind the modal */
  backdrop?: boolean;
  /** Additional styles for the modal dialog */
  style?: React.CSSProperties;
}

/**
 * A modal/dialog component for displaying content in a layer above the page
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      closeOnOutsideClick = true,
      closeOnEsc = true,
      centered = true,
      size = "md",
      showCloseButton = true,
      footer,
      containerClassName,
      contentClassName,
      onBeforeOpen,
      onAfterOpen,
      onBeforeClose,
      onAfterClose,
      disableScroll = true,
      backdrop = true,
      style,
      ...props
    },
    ref,
  ) => {
    const [isMounted, setIsMounted] = useState(false);

    // Ensure we're client-side before mounting the modal
    useEffect(() => {
      setIsMounted(true);
      return () => setIsMounted(false);
    }, []);

    // Handle escape key press
    useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
        if (isOpen && closeOnEsc && e.key === "Escape") {
          onClose();
        }
      };

      if (isOpen) {
        window.addEventListener("keydown", handleEsc);
      }

      return () => {
        window.removeEventListener("keydown", handleEsc);
      };
    }, [isOpen, closeOnEsc, onClose]);

    // Disable scrolling when modal is open
    useEffect(() => {
      if (disableScroll) {
        if (isOpen) {
          document.body.style.overflow = "hidden";
        } else {
          document.body.style.overflow = "";
        }
      }

      return () => {
        if (disableScroll) {
          document.body.style.overflow = "";
        }
      };
    }, [isOpen, disableScroll]);

    // Fire callbacks on open/close
    useEffect(() => {
      if (isOpen) {
        onBeforeOpen?.();
      } else {
        onBeforeClose?.();
      }
    }, [isOpen, onBeforeOpen, onBeforeClose]);

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && closeOnOutsideClick) {
        onClose();
      }
    };

    // Size classes
    const sizeClasses = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      full: "max-w-full h-full m-0 rounded-none",
    };

    // Animation variants
    const backdropVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    };

    const modalVariants = {
      hidden: { opacity: 0, scale: 0.95, y: 10 },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          type: "spring",
          damping: 25,
          stiffness: 300,
        },
      },
      exit: {
        opacity: 0,
        scale: 0.95,
        y: 10,
        transition: {
          duration: 0.2,
        },
      },
    };

    // Skip rendering on the server or if not mounted yet
    if (!isMounted) return null;

    // Get target node for portal
    const portalRoot = typeof window !== "undefined" ? document.body : null;
    if (!portalRoot) return null;

    return createPortal(
      <AnimatePresence initial={false} onExitComplete={onAfterClose}>
        {isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            aria-modal="true"
            role="dialog"
            {...props}
          >
            {/* Backdrop */}
            {backdrop && (
              <motion.div
                className="fixed inset-0 bg-black/50"
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                onClick={handleBackdropClick}
              />
            )}

            {/* Modal */}
            <motion.div
              ref={ref}
              className={cn(
                "relative w-full mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden",
                sizeClasses[size],
                centered ? "my-auto" : "my-12",
                containerClassName,
              )}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onAnimationComplete={(definition) => {
                if (definition === "visible") {
                  onAfterOpen?.();
                }
              }}
              style={style}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  {title && (
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {title}
                    </h3>
                  )}

                  {showCloseButton && (
                    <button
                      type="button"
                      className="p-1 rounded-md text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <X size={20} />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className={cn("overflow-y-auto", contentClassName)}>
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      portalRoot,
    );
  },
);

Modal.displayName = "Modal";

// Confirmation modal variant
interface ConfirmModalProps extends Omit<ModalProps, "children"> {
  /** The message to display */
  message: string;
  /** The text for the confirm button */
  confirmText?: string;
  /** The text for the cancel button */
  cancelText?: string;
  /** Called when the confirm button is clicked */
  onConfirm: () => void;
  /** The variant of the confirm button */
  confirmVariant?: "primary" | "danger" | "success" | "warning";
  /** Icon to show in the modal */
  icon?: React.ReactNode;
}

/**
 * A specialized modal for confirmation dialogs
 */
export const ConfirmModal = ({
  message,
  title = "Confirm",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  confirmVariant = "primary",
  icon,
  ...props
}: ConfirmModalProps) => {
  // Map variants to button classes
  const buttonVariants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    warning: "bg-amber-600 hover:bg-amber-700 text-white",
  };

  return (
    <Modal title={title} {...props}>
      <div className="p-6">
        {icon && <div className="flex justify-center mb-4">{icon}</div>}

        <p className="text-gray-700 dark:text-gray-300 text-center mb-6">
          {message}
        </p>

        <div className="flex justify-center space-x-3">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={props.onClose}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={cn(
              "px-4 py-2 rounded-md",
              buttonVariants[confirmVariant],
            )}
            onClick={() => {
              onConfirm();
              props.onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
