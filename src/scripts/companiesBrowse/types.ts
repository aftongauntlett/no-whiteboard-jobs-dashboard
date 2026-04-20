import type { Company, EmploymentType } from "@data/types";
import type { SortKey } from "./filters";
import type { InterviewTagId } from "../../config/interviewTags";

export type IndexedCompany = {
  company: Company;
  searchText: string;
  interviewTags: readonly InterviewTagId[];
};

export type BrowseState = {
  query: string;
  sort: SortKey;
  selectedEmployment: Set<EmploymentType>;
  selectedInterviewTags: Set<InterviewTagId>;
  aiFriendly: boolean;
  hasInterviewDetails: boolean;
  perPage: number;
  page: number;
};

export type MobilePagingState = "idle" | "loading" | "done";
