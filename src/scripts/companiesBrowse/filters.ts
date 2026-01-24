import type { Company, EmploymentType } from "@data/types";
import type { InterviewTagId } from "../../config/interviewTags";

export type SortKey = "name-asc" | "name-desc";

export type IndexedCompany = {
  company: Company;
  searchText: string;
  interviewTags: readonly InterviewTagId[];
};

export function computeResults(args: {
  indexed: IndexedCompany[];
  query: string;
  sort: SortKey;
  selectedEmployment: Set<EmploymentType>;
  selectedInterviewTags: Set<InterviewTagId>;
  resultsCache: Map<string, Company[]>;
}): Company[] {
  const q = args.query;
  const employmentKey =
    args.selectedEmployment.size > 0
      ? Array.from(args.selectedEmployment).sort().join(",")
      : "";

  const interviewKey =
    args.selectedInterviewTags.size > 0
      ? Array.from(args.selectedInterviewTags).sort().join(",")
      : "";

  const cacheKey = `${q}\u0001${args.sort}\u0001${employmentKey}\u0001${interviewKey}`;

  const cached = args.resultsCache.get(cacheKey);
  if (cached) return cached;

  if (args.resultsCache.size > 50) args.resultsCache.clear();

  let result = args.indexed;

  if (args.selectedEmployment.size > 0) {
    result = result.filter((c) =>
      args.selectedEmployment.has(c.company.employmentType),
    );
  }

  if (args.selectedInterviewTags.size > 0) {
    const selected = Array.from(args.selectedInterviewTags);
    // OR behavior: include companies that match ANY selected tag.
    // To switch to AND behavior, replace `some` with `every`.
    result = result.filter((c) =>
      selected.some((t) => c.interviewTags.includes(t)),
    );
  }

  if (q) {
    result = result.filter((c) => c.searchText.includes(q));
  }

  const sorted = [...result];

  sorted.sort((a, b) => {
    if (args.sort === "name-desc")
      return b.company.name.localeCompare(a.company.name);
    return a.company.name.localeCompare(b.company.name);
  });

  const output = sorted.map((c) => c.company);
  args.resultsCache.set(cacheKey, output);
  return output;
}
