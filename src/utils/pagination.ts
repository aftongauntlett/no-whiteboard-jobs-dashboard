/**
 * Framework-agnostic pagination utilities
 *
 * Provides reusable functions for implementing pagination logic across different views
 * and components. Designed to work with any array of items and support URL-based state.
 */

/**
 * Pagination result metadata
 */
export interface PaginationResult<T> {
  /** The subset of items for the current page */
  paginatedItems: T[];
  /** Total number of pages available */
  totalPages: number;
  /** The validated current page number (clamped to valid range) */
  currentPage: number;
  /** Whether there is a next page available */
  hasNextPage: boolean;
  /** Whether there is a previous page available */
  hasPreviousPage: boolean;
}

/**
 * Paginates an array of items based on the current page and page size.
 *
 * @param items - The full array of items to paginate
 * @param currentPage - The requested page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Pagination metadata including the sliced items and navigation flags
 *
 * @example
 * ```typescript
 * const result = paginateArray(companies, 2, 24);
 * console.log(result.paginatedItems); // Items 25-48
 * console.log(result.totalPages); // Total pages needed
 * ```
 */
export function paginateArray<T>(
  items: T[],
  currentPage: number,
  pageSize: number,
): PaginationResult<T> {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Clamp currentPage to valid range
  const validatedPage = Math.max(1, Math.min(currentPage, totalPages || 1));

  // Calculate slice indices
  const startIndex = (validatedPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  // Slice the array for current page
  const paginatedItems = items.slice(startIndex, endIndex);

  // Calculate navigation flags
  const hasNextPage = validatedPage < totalPages;
  const hasPreviousPage = validatedPage > 1;

  return {
    paginatedItems,
    totalPages,
    currentPage: validatedPage,
    hasNextPage,
    hasPreviousPage,
  };
}

/**
 * Builds a URL for a specific page number using path-based pagination.
 *
 * @param basePath - The base URL path (unused in current implementation)
 * @param page - The page number to navigate to
 * @param preserveParams - Optional existing query parameters (ignored in path-based pagination)
 * @returns The complete URL string for the page
 *
 * @example
 * ```typescript
 * buildPageUrl('', 2); // '/page/2'
 * buildPageUrl('', 1); // '/'
 * ```
 */
export function buildPageUrl(
  basePath: string,
  page: number,
  preserveParams?: URLSearchParams,
): string {
  const base = basePath.replace(/\/+$/, "");
  const path =
    page === 1 ? (base.length > 0 ? base : "/") : `${base}/page/${page}`;

  if (!preserveParams || preserveParams.size === 0) {
    return path;
  }

  return `${path}?${preserveParams.toString()}`;
}

export type PageNumberToken = number | "ellipsis";

export function generatePageNumbers(
  current: number,
  total: number,
): PageNumberToken[] {
  const pages: PageNumberToken[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("ellipsis");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("ellipsis");

  pages.push(total);
  return pages;
}
