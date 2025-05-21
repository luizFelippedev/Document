// frontend/src/utils/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function that merges multiple class values and resolves Tailwind CSS class conflicts.
 * It combines the functionality of clsx and tailwind-merge.
 *
 * @param inputs - The class values to merge
 * @returns A string of merged class names with resolved Tailwind CSS conflicts
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
