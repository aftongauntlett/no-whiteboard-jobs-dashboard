import type { Company, EmploymentType } from "@data/types";
import type { SortKey } from "./filters";

export type IndexedCompany = {
  company: Company;
  searchText: string;
};

export type BrowseState = {
  query: string;
  sort: SortKey;
  selectedEmployment: Set<EmploymentType>;
  perPage: number;
  page: number;
};

export type MobilePagingState = "idle" | "loading" | "done";
