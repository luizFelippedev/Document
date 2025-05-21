// frontend/src/components/ui/Select.tsx
"use client";

import React, { useState, useRef, useEffect, forwardRef } from "react";
import { cn } from "@/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, X, Search } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  group?: string;
}

export interface SelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Current selected value */
  value: string;
  /** Called when the value changes */
  onChange: (value: string) => void;
  /** Array of options */
  options: SelectOption[];
  /** Placeholder text when no option is selected */
  placeholder?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Whether the select has an error */
  error?: string;
  /** Element to display on the left side of the select */
  leftElement?: React.ReactNode;
  /** Element to display on the right side of the select */
  rightElement?: React.ReactNode;
  /** Whether to show a loading indicator */
  loading?: boolean;
  /** Whether to show a clear button when a value is selected */
  clearable?: boolean;
  /** Called when the clear button is clicked */
  onClear?: () => void;
  /** Whether to allow searching options */
  searchable?: boolean;
  /** The visual variant of the select */
  variant?: "default" | "filled" | "underlined";
  /** The size of the select */
  size?: "sm" | "md" | "lg";
  /** Whether to show option descriptions */
  showDescriptions?: boolean;
  /** Whether to show option groups */
  showGroups?: boolean;
  /** Whether to show option icons */
  showIcons?: boolean;
  /** Whether the select allows multiple selections */
  multiple?: boolean;
  /** Whether options are creatable */
  creatable?: boolean;
  /** Called when a new option is created */
  onCreateOption?: (value: string) => void;
  /** The maximum height of the dropdown */
  maxHeight?: string;
  /** The minimum width of the dropdown */
  minWidth?: string;
  /** The position of the dropdown */
  position?: "bottom" | "top" | "auto";
  /** Additional class name */
  className?: string;
  /** Additional dropdown class name */
  dropdownClassName?: string;
}

/**
 * Select component for dropdown selections
 */
export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      value,
      onChange,
      options,
      placeholder = "Select an option",
      disabled = false,
      error,
      leftElement,
      rightElement,
      loading = false,
      clearable = false,
      onClear,
      searchable = false,
      variant = "default",
      size = "md",
      showDescriptions = false,
      showGroups = false,
      showIcons = false,
      multiple = false, // Not fully implemented in this version
      creatable = false,
      onCreateOption,
      maxHeight = "300px",
      minWidth = "200px",
      position = "bottom",
      className,
      dropdownClassName,
      ...props
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">(
      position === "auto" ? "bottom" : position,
    );

    // Get the selected option from the value
    const selectedOption = options.find((option) => option.value === value);

    // Filter options based on search query
    const filteredOptions = options.filter((option) => {
      if (!searchQuery) return true;
      return option.label.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Group options if showGroups is true
    const groupedOptions = showGroups
      ? filteredOptions.reduce(
          (groups, option) => {
            const group = option.group || "Other";
            if (!groups[group]) groups[group] = [];
            groups[group].push(option);
            return groups;
          },
          {} as Record<string, SelectOption[]>,
        )
      : { "": filteredOptions };

    // Handle click outside to close dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    // Handle keyboard navigation
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (!isOpen) return;

        switch (event.key) {
          case "Escape":
            setIsOpen(false);
            break;
          case "ArrowDown":
            event.preventDefault();
            // Navigate to the next option
            // (not implemented in this simplified version)
            break;
          case "ArrowUp":
            event.preventDefault();
            // Navigate to the previous option
            // (not implemented in this simplified version)
            break;
          case "Enter":
            // Select the currently focused option
            // (not implemented in this simplified version)
            break;
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [isOpen]);

    // Focus search input when dropdown opens
    useEffect(() => {
      if (isOpen && searchable && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isOpen, searchable]);

    // Determine dropdown position based on available space
    useEffect(() => {
      if (
        position === "auto" &&
        isOpen &&
        containerRef.current &&
        dropdownRef.current
      ) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const dropdownHeight = dropdownRef.current.offsetHeight;
        const viewportHeight = window.innerHeight;

        const spaceBelow = viewportHeight - containerRect.bottom;
        const spaceAbove = containerRect.top;

        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          setDropdownPosition("top");
        } else {
          setDropdownPosition("bottom");
        }
      }
    }, [isOpen, position]);

    // Toggle dropdown
    const toggleDropdown = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
        // Clear search when closing
        if (isOpen) {
          setSearchQuery("");
        }
      }
    };

    // Handle option selection
    const handleOptionSelect = (option: SelectOption) => {
      if (option.disabled) return;

      onChange(option.value);
      setIsOpen(false);
      setSearchQuery("");
    };

    // Handle clear button click
    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();

      if (onClear) {
        onClear();
      } else {
        onChange("");
      }

      setSearchQuery("");
    };

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    };

    // Handle create option
    const handleCreateOption = () => {
      if (creatable && searchQuery && onCreateOption) {
        onCreateOption(searchQuery);
        setSearchQuery("");
        setIsOpen(false);
      }
    };

    // Determine variant styles
    const getVariantStyles = () => {
      switch (variant) {
        case "filled":
          return "bg-gray-100 dark:bg-gray-700 border-transparent focus-within:bg-white dark:focus-within:bg-gray-800";
        case "underlined":
          return "border-t-0 border-l-0 border-r-0 rounded-none px-0 bg-transparent";
        default:
          return "bg-white dark:bg-gray-800";
      }
    };

    // Determine size styles
    const getSizeStyles = () => {
      switch (size) {
        case "sm":
          return "h-8 text-xs";
        case "lg":
          return "h-12 text-base";
        default:
          return "h-10 text-sm";
      }
    };

    // Generate class names
    const selectClasses = cn(
      "relative flex items-center w-full px-3 border rounded-md appearance-none transition-colors cursor-pointer",
      "focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-1",
      getVariantStyles(),
      getSizeStyles(),
      {
        "pl-10": !!leftElement,
        "pr-10": !!rightElement || clearable,
        "opacity-60 cursor-not-allowed": disabled,
        "border-red-300 focus-within:border-red-500 focus-within:ring-red-500 dark:border-red-800":
          !!error,
        "border-gray-300 focus-within:border-blue-500 focus-within:ring-blue-500 dark:border-gray-600 dark:focus-within:border-blue-500":
          !error,
      },
      className,
    );

    return (
      <div className="space-y-1" ref={ref}>
        <div ref={containerRef} className="relative">
          {/* Select field */}
          <div
            className={selectClasses}
            onClick={toggleDropdown}
            tabIndex={0}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-disabled={disabled}
            {...props}
          >
            {/* Left element/icon */}
            {leftElement && (
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
                {leftElement}
              </div>
            )}

            {/* Selected value or placeholder */}
            {selectedOption ? (
              <div className="flex items-center flex-1 truncate">
                {showIcons && selectedOption.icon && (
                  <span className="mr-2 flex-shrink-0">
                    {selectedOption.icon}
                  </span>
                )}
                <span className="truncate">{selectedOption.label}</span>
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 truncate">
                {placeholder}
              </span>
            )}

            {/* Clear button */}
            {clearable && value && (
              <button
                type="button"
                className="absolute inset-y-0 right-8 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                onClick={handleClear}
                aria-label="Clear selection"
              >
                <X size={14} />
              </button>
            )}

            {/* Right element or dropdown indicator */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-500 dark:text-gray-400">
              {rightElement || <ChevronDown size={16} />}
            </div>
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={dropdownRef}
                className={cn(
                  "absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden",
                  dropdownPosition === "top" && "bottom-full mb-1 mt-0",
                  dropdownClassName,
                )}
                style={{
                  minWidth,
                  maxHeight: "none",
                }}
                initial={{
                  opacity: 0,
                  y: dropdownPosition === "top" ? 10 : -10,
                }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  y: dropdownPosition === "top" ? 10 : -10,
                  transition: { duration: 0.2 },
                }}
                transition={{ duration: 0.2 }}
              >
                {/* Search */}
                {searchable && (
                  <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        ref={inputRef}
                        type="text"
                        className="w-full p-1.5 pl-8 text-sm bg-gray-100 dark:bg-gray-700 border-none rounded focus:ring-1 focus:ring-blue-500"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}

                {/* Options list */}
                <div className="overflow-y-auto" style={{ maxHeight }}>
                  {Object.entries(groupedOptions).map(
                    ([group, groupOptions]) => (
                      <div key={group}>
                        {/* Group header */}
                        {showGroups && group !== "" && (
                          <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50">
                            {group}
                          </div>
                        )}

                        {/* Group options */}
                        {groupOptions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                            No options found
                          </div>
                        ) : (
                          groupOptions.map((option) => (
                            <div
                              key={option.value}
                              className={cn(
                                "px-3 py-2 flex items-center cursor-pointer",
                                option.disabled
                                  ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-700",
                                option.value === value &&
                                  "bg-blue-50 dark:bg-blue-900/20",
                              )}
                              onClick={() => handleOptionSelect(option)}
                              role="option"
                              aria-selected={option.value === value}
                            >
                              {/* Check icon for selected option */}
                              <div className="mr-3 flex-shrink-0 w-4">
                                {option.value === value && (
                                  <Check
                                    size={16}
                                    className="text-blue-600 dark:text-blue-400"
                                  />
                                )}
                              </div>

                              {/* Option icon */}
                              {showIcons && option.icon && (
                                <div className="mr-2 flex-shrink-0">
                                  {option.icon}
                                </div>
                              )}

                              {/* Option content */}
                              <div className="flex-1 min-w-0">
                                <div className="text-gray-900 dark:text-white truncate">
                                  {option.label}
                                </div>

                                {showDescriptions && option.description && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {option.description}
                                  </div>
                                )}
                              </div>

                              {/* Option suffix */}
                              {option.suffix && (
                                <div className="ml-2 flex-shrink-0 text-gray-500 dark:text-gray-400">
                                  {option.suffix}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    ),
                  )}

                  {/* Create option */}
                  {creatable &&
                    searchQuery &&
                    !filteredOptions.some(
                      (option) =>
                        option.label.toLowerCase() ===
                        searchQuery.toLowerCase(),
                    ) && (
                      <div
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700"
                        onClick={handleCreateOption}
                      >
                        Create "
                        <span className="font-medium">{searchQuery}</span>"
                      </div>
                    )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
