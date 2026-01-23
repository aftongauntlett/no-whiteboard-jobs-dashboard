export const EMPLOYMENT_TYPES = ["Remote", "Hybrid", "In-office"] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export function isEmploymentType(value: unknown): value is EmploymentType {
  return (EMPLOYMENT_TYPES as readonly string[]).includes(String(value));
}

export type CompanySource = "upstream" | "local";

export type CurationStatus = "new" | "edited";

export type Company = {
  id: string;
  name: string;
  careersUrl?: string;
  locations: string[];
  employmentType: EmploymentType;
  interviewProcess?: string;

  /**
   * Derived field used for client-side sorting.
   *
   * - For locally edited/added entries, this is set from overrideDate.
   * - For upstream entries, this is typically undefined.
   *
   * Format: YYYY-MM-DD
   */
  lastUpdated?: string;

  /** Indicates whether this entry comes from upstream data or is maintained locally. */
  source: CompanySource;

  /** Only present when source === "local". */
  curationStatus?: CurationStatus;

  /** Only present when source === "local". */
  overrideReason?: string;
  /** Only present when source === "local". Format: YYYY-MM-DD */
  overrideDate?: string;

  /** Sanitized HTML derived from interviewProcess Markdown. */
  interviewProcessHtml?: string;
};

export type CompanyLocalOverride = {
  id: string;
  source: "local";
  overrideReason: string;
  overrideDate: string;

  name?: string;
  careersUrl?: string;
  locations?: string[];
  employmentType?: EmploymentType;
  interviewProcess?: string;
};
