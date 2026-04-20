import type { Company, EmploymentType } from "@data/types";
import type { InterviewTagId } from "../../config/interviewTags";

export type SortKey = "name-asc" | "name-desc" | "curated-desc";

export type IndexedCompany = {
  company: Company;
  searchText: string;
  interviewTags: readonly InterviewTagId[];
};

export const AI_KEYWORDS_RE =
  /\bai\b|cursor|claude|copilot|vibe coding|ai-native|agentic/i;

export function computeResults(args: {
  indexed: IndexedCompany[];
  query: string;
  sort: SortKey;
  selectedEmployment: Set<EmploymentType>;
  selectedInterviewTags: Set<InterviewTagId>;
  aiFriendly: boolean;
  hasInterviewDetails: boolean;
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

  const cacheKey = `${q}\u0001${args.sort}\u0001${employmentKey}\u0001${interviewKey}\u0001${args.aiFriendly ? "1" : "0"}\u0001${args.hasInterviewDetails ? "1" : "0"}`;

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

  if (args.aiFriendly) {
    result = result.filter((c) => {
      if (c.company.source === "jsearch") return true;
      const text = (c.company.interviewProcessHtml ?? "").replace(
        /<[^>]*>/g,
        " ",
      );
      return AI_KEYWORDS_RE.test(text);
    });
  }

  if (args.hasInterviewDetails) {
    result = result.filter((c) => {
      const text = (c.company.interviewProcessHtml ?? "")
        .replace(/<[^>]*>/g, " ")
        .trim();
      return text !== "" && text !== "No details provided.";
    });
  }

  if (q) {
    const qNorm = q.toLowerCase().replace(/\s+/g, " ").trim();
    result = result.filter((c) => c.searchText.includes(qNorm));
  }

  const sorted = [...result];

  sorted.sort((a, b) => {
    if (args.sort === "curated-desc") {
      const aLocal =
        a.company.source === "local" || a.company.source === "jsearch";
      const bLocal =
        b.company.source === "local" || b.company.source === "jsearch";

      if (aLocal !== bLocal) return aLocal ? -1 : 1;

      const aDate = a.company.lastUpdated ?? "";
      const bDate = b.company.lastUpdated ?? "";
      if (aDate !== bDate) return bDate.localeCompare(aDate);

      const aStatus = a.company.curationStatus ?? "edited";
      const bStatus = b.company.curationStatus ?? "edited";
      if (aStatus !== bStatus) return aStatus === "new" ? -1 : 1;

      return a.company.name.localeCompare(b.company.name);
    }

    if (args.sort === "name-desc")
      return b.company.name.localeCompare(a.company.name);
    return a.company.name.localeCompare(b.company.name);
  });

  const output = sorted.map((c) => c.company);
  args.resultsCache.set(cacheKey, output);
  return output;
}
