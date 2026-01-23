import type { EmploymentType } from "@data/types";

export type EmploymentBadgeVariant = "info" | "warning" | "success";

export const EMPLOYMENT_BADGE_VARIANT_BY_TYPE: Record<
  EmploymentType,
  EmploymentBadgeVariant
> = {
  Remote: "info",
  Hybrid: "warning",
  "In-office": "success",
};

export function employmentBadgeVariant(
  type: EmploymentType,
): EmploymentBadgeVariant {
  return EMPLOYMENT_BADGE_VARIANT_BY_TYPE[type];
}

const BADGE_SOLID_CLASSES_BY_VARIANT: Record<EmploymentBadgeVariant, string> = {
  info: "bg-info-bg/20 text-info-text",
  warning: "bg-warning-bg/20 text-warning-text",
  success: "bg-success-bg/20 text-success-text",
};

export function employmentBadgeClasses(type: EmploymentType): string {
  const variant = employmentBadgeVariant(type);
  return `ui-badge ${BADGE_SOLID_CLASSES_BY_VARIANT[variant]}`;
}

export const COMPANY_CARD_INTERACTIVE_CLASS =
  "company-card company-card--interactive group relative focus-within:ring-2 focus-within:ring-accent/30 focus-within:ring-offset-2 focus-within:ring-offset-bg-light dark:focus-within:ring-offset-bg-dark";

export const COMPANY_CARD_STATIC_CLASS = "company-card group";

export const COMPANY_CARD_LINK_CLASS =
  "absolute inset-0 z-20 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";

export const COMPANY_CARD_HEADER_CLASS =
  "flex items-start justify-between gap-3";

export const COMPANY_CARD_TITLE_CLASS =
  "text-base font-semibold leading-tight text-text-light dark:text-text-dark min-w-0";

export const COMPANY_CARD_TITLE_INLINE_CLASS =
  "inline-flex items-center gap-2 min-w-0";

export const COMPANY_CARD_NAME_HOVER_CLASS = "group-hover:text-accent";

export const COMPANY_CARD_EMPLOYMENT_CLASS = "ui-badge";

export const COMPANY_CARD_EXTERNAL_ICON_CLASS =
  "invisible inline-flex h-7 w-7 items-center justify-center rounded-md text-accent opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity";

export const COMPANY_LOCATIONS_CLASS_CARD = "mt-0.5 flex flex-wrap gap-2";
export const COMPANY_LOCATIONS_CLASS_LIST =
  "mt-1.5 flex flex-wrap items-center gap-2";

export const COMPANY_INTERVIEW_TEXT_CLASS_CARD =
  "text-sm text-text-mutedLight dark:text-text-mutedDark group-hover:text-text-light dark:group-hover:text-text-dark group-focus-within:text-text-light dark:group-focus-within:text-text-dark transition-colors";

export const COMPANY_INTERVIEW_TEXT_CLASS_LIST =
  "text-xs sm:text-sm text-text-mutedLight dark:text-text-mutedDark group-hover:text-text-light dark:group-hover:text-text-dark group-focus-within:text-text-light dark:group-focus-within:text-text-dark";

export const COMPANY_INTERVIEW_TOGGLE_CLASS =
  "mt-1 hidden text-xs font-medium text-accent hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 rounded";

export const COMPANY_LIST_ITEM_CLASS =
  "company-list-item group relative px-4 py-3 pr-12 sm:px-5 sm:py-4 sm:pr-14 md:pr-5 transition-colors md:col-span-4 md:grid md:grid-cols-subgrid md:gap-x-4 md:items-stretch";

export const COMPANY_LIST_LINK_CLASS =
  "absolute inset-0 z-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-light dark:focus-visible:ring-offset-bg-dark";

export const COMPANY_LIST_GRID_CLASS = "grid grid-cols-1 gap-3 md:contents";

export const COMPANY_LIST_TITLE_CLASS =
  "min-w-0 text-sm font-semibold leading-snug text-text-light dark:text-text-dark";

export const COMPANY_LIST_NAME_CLASS =
  "block whitespace-nowrap truncate group-hover:text-accent group-focus-within:text-accent";

export const COMPANY_LIST_COL_B_CLASS =
  "min-w-0 md:border-l md:border-border-light/80 dark:md:border-border-dark/80 md:px-4";

export const COMPANY_LIST_COL_C_CLASS =
  "min-w-0 md:border-l md:border-border-light/80 dark:md:border-border-dark/80 md:pl-4";

export const COMPANY_LIST_ACTION_WRAPPER_CLASS =
  "z-30 absolute right-4 top-3 sm:right-5 sm:top-4 md:static md:justify-self-end md:self-start";

export const COMPANY_LIST_ACTION_LINK_CLASS =
  "invisible inline-flex h-8 w-8 items-center justify-center rounded-md text-accent opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";
