/**
 * Pagination configuration constants
 *
 * Centralizes pagination settings to avoid magic numbers throughout the codebase.
 * These values can be easily adjusted for different views or user preferences.
 */

/**
 * Number of companies displayed per page in the Browse Companies view.
 * This value balances performance, user experience, and visual density.
 */
export const COMPANIES_PER_PAGE = 24;

/**
 * Default page number when no page parameter is provided in the URL.
 * Always starts at page 1 for intuitive navigation.
 */
export const DEFAULT_PAGE = 1;
