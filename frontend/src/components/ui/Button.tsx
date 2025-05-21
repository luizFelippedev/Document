// frontend/src/components/ui/Button.tsx
"use client";

import React, { forwardRef, ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The variant style of the button */
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "link"
    | "danger"
    | "success"
    | "warning";
  /** The size of the button */
  size?: "sm" | "md" | "lg" | "icon";
  /** Whether the button takes the full width of its container */
  fullWidth?: boolean;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Text to show when loading */
  loadingText?: string;
  /** Icon to show on the left side of the button */
  leftIcon?: ReactNode;
  /** Icon to show on the right side of the button */
  rightIcon?: ReactNode;
  /** Whether to render an element without a wrapping button */
  asChild?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * A flexible button component with multiple variants, sizes, and states
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      asChild = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    // When in loading state, button should be disabled
    const isDisabled = disabled || loading;

    // Determine base styles based on variant
    const variantStyles = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      secondary:
        "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600",
      outline:
        "border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300",
      ghost:
        "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
      link: "bg-transparent text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline p-0 h-auto",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
      success:
        "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
      warning:
        "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400",
    };

    // Determine size styles
    const sizeStyles = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-10 w-10 p-2.5",
    };

    // Create class names based on props
    const buttonClasses = cn(
      "relative inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none",
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && "w-full",
      className,
    );

    // If asChild is true, use Slot component to render children's elements
    const Component = asChild ? Slot : "button";

    return (
      <Component
        className={buttonClasses}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className={cn("mr-2", size === "sm" ? "text-xs" : "")}>
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className={cn("ml-2", size === "sm" ? "text-xs" : "")}>
                {rightIcon}
              </span>
            )}
          </>
        )}
      </Component>
    );
  },
);

Button.displayName = "Button";
