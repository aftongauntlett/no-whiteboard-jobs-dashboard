import type { Company, EmploymentType } from "@data/types";

export type SortKey = "name-asc" | "name-desc" | "last-updated";

export type IndexedCompany = {
  company: Company;
  searchText: string;
};

export function computeResults(args: {
  indexed: IndexedCompany[];
  query: string;
  sort: SortKey;
  selectedEmployment: Set<EmploymentType>;
  resultsCache: Map<string, Company[]>;
}): Company[] {
  const q = args.query;
  const employmentKey =
    args.selectedEmployment.size > 0
      ? Array.from(args.selectedEmployment).sort().join(",")
      : "";
  const cacheKey = `${q}\u0001${args.sort}\u0001${employmentKey}`;

  const cached = args.resultsCache.get(cacheKey);
  if (cached) return cached;

  if (args.resultsCache.size > 50) args.resultsCache.clear();

  let result = args.indexed;

  if (args.selectedEmployment.size > 0) {
    result = result.filter((c) =>
      args.selectedEmployment.has(c.company.employmentType),
    );
  }

  if (q) {
    result = result.filter((c) => c.searchText.includes(q));
  }

  const sorted = [...result];

  sorted.sort((a, b) => {
    if (args.sort === "name-asc")
      return a.company.name.localeCompare(b.company.name);
    if (args.sort === "name-desc")
      return b.company.name.localeCompare(a.company.name);

    const da = a.company.lastUpdated ?? "";
    const db = b.company.lastUpdated ?? "";
    if (da !== db) return db.localeCompare(da);
    return a.company.name.localeCompare(b.company.name);
  });

  const output = sorted.map((c) => c.company);
  args.resultsCache.set(cacheKey, output);
  return output;
}
