// frontend/src/types/common.ts
// Common types used throughout the application

export type ThemeMode = "light" | "dark" | "system";

export type SortDirection = "asc" | "desc";

export type SortBy<T extends string> = {
  field: T;
  direction: SortDirection;
};

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface FileUploadResult {
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  path: string;
}

export interface ErrorResponse {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface FilterParams<T extends string = string> {
  search?: string;
  sortBy?: SortBy<T>;
  filters?: Record<string, any>;
  page?: number;
  limit?: number;
}

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface MenuItem {
  id: string;
  label: string;
  path?: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
}

export type Status = "idle" | "loading" | "success" | "error";

export type ResponseStatus = "success" | "error" | "warning" | "info";

export type Size = "xs" | "sm" | "md" | "lg" | "xl";

export type Alignment = "left" | "center" | "right";

export type Variant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "default"
  | "outline"
  | "ghost";
