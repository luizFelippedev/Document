// frontend/src/utils/helpers.ts
import { useAuth } from "@/hooks/useAuth";

/**
 * Debounce function to limit how often a function can be called
 * Used throughout the application for input fields, search, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit how often a function can be called
 * Useful for scroll events, window resizing, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 300,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function (...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Generate a random ID
 */
export function generateId(length: number = 10): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Generate a random color based on a string
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }

  return color;
}

/**
 * Check if a URL is external
 */
export function isExternalUrl(url: string): boolean {
  return /^(https?:)?\/\//.test(url);
}

/**
 * Check if the current user has a specific role
 */
export function hasRole(role: string): boolean {
  try {
    const { user } = useAuth();
    return user?.role === role;
  } catch (error) {
    return false;
  }
}

/**
 * Group an array of objects by a key
 */
export function groupBy<T extends Record<string, any>>(
  array: T[],
  key: keyof T,
): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      result[groupKey] = result[groupKey] || [];
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>,
  );
}

/**
 * Download a file from a URL
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy: ", error);
    return false;
  }
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if an object is empty
 */
export function isEmptyObject(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Format query parameters for URL
 */
export function formatQueryParams(params: Record<string, any>): string {
  return Object.entries(params)
    .filter(
      ([_, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(([key, value]) => {
      // Handle arrays
      if (Array.isArray(value)) {
        return value
          .map((v) => `${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`)
          .join("&");
      }
      // Handle objects
      if (typeof value === "object") {
        return `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`;
      }
      // Handle primitives
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join("&");
}

/**
 * Utility to handle API error messages
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "An unexpected error occurred";
}

/**
 * Create a cancelable request
 */
export function createCancelableRequest<T>(requestFn: () => Promise<T>): {
  promise: Promise<T>;
  cancel: () => void;
} {
  const controller = new AbortController();
  const signal = controller.signal;

  // Create the promise
  const promise = new Promise<T>((resolve, reject) => {
    requestFn().then(resolve).catch(reject);

    // Listen for abort
    signal.addEventListener("abort", () => {
      reject(new Error("Request was canceled"));
    });
  });

  // Return the promise and cancel function
  return {
    promise,
    cancel: () => controller.abort(),
  };
}
