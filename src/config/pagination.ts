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

import type { ViewMode } from "../utils/viewMode";

export type CompaniesViewMode = ViewMode;

export const COMPANIES_PER_PAGE_OPTIONS: Record<CompaniesViewMode, number[]> = {
  card: [12, 24, 48, 96],
  list: [10, 25, 50, 100],
};

export const DEFAULT_COMPANIES_PER_PAGE: Record<CompaniesViewMode, number> = {
  card: 24,
  list: 25,
};

/**
 * Default page number when no page parameter is provided in the URL.
 * Always starts at page 1 for intuitive navigation.
 */
export const DEFAULT_PAGE = 1;
