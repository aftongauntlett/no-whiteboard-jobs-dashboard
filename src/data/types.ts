export const EMPLOYMENT_TYPES = ["Remote", "Hybrid", "In-office"] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export function isEmploymentType(value: unknown): value is EmploymentType {
  return (EMPLOYMENT_TYPES as readonly string[]).includes(String(value));
}

export type Company = {
  id: string;
  name: string;
  careersUrl?: string;
  locations: string[];
  employmentType: EmploymentType;
  interviewProcess?: string;
};
