import upstreamCompanies from "./companies.json";
import localOverrides from "./companies.local.json";

import type { Company, CompanyLocalOverride } from "./types";
import { renderInterviewProcessMarkdown } from "../utils/markdown";

export type ClientCompany = Omit<
  Company,
  "interviewProcess" | "overrideReason" | "overrideDate"
>;

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isCompanyLocalOverride(value: unknown): value is CompanyLocalOverride {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    v.source === "local" &&
    typeof v.overrideReason === "string" &&
    typeof v.overrideDate === "string"
  );
}

function requireNewCompanyFields(id: string, candidate: CompanyLocalOverride) {
  const missing: string[] = [];
  if (!candidate.name) missing.push("name");
  if (!candidate.locations) missing.push("locations");
  if (!candidate.employmentType) missing.push("employmentType");
  if (missing.length > 0) {
    throw new Error(
      `companies.local.json entry '${id}' is a new company but is missing required field(s): ${missing.join(
        ", ",
      )}`,
    );
  }
}

function arraysEqual<T>(
  a: readonly T[] | undefined,
  b: readonly T[] | undefined,
) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function hasEffectiveOverrideFields(
  candidate: CompanyLocalOverride,
  upstreamCompany: Company,
): boolean {
  if (candidate.name !== undefined && candidate.name !== upstreamCompany.name)
    return true;

  if (
    candidate.careersUrl !== undefined &&
    candidate.careersUrl !== upstreamCompany.careersUrl
  )
    return true;

  if (
    candidate.locations !== undefined &&
    !arraysEqual(candidate.locations, upstreamCompany.locations)
  )
    return true;

  if (
    candidate.employmentType !== undefined &&
    candidate.employmentType !== upstreamCompany.employmentType
  )
    return true;

  if (candidate.interviewProcess !== undefined) {
    const a = candidate.interviewProcess ?? "";
    const b = upstreamCompany.interviewProcess ?? "";
    if (a !== b) return true;
  }

  return false;
}

function mergeCompany(args: {
  upstream?: Omit<
    Company,
    "source" | "overrideReason" | "overrideDate" | "interviewProcessHtml"
  >;
  local: CompanyLocalOverride;
  curationStatus: NonNullable<Company["curationStatus"]>;
}): Company {
  const base = args.upstream;
  const merged = {
    ...(base ?? {}),
    ...args.local,
  } as unknown as Company;

  merged.source = "local";
  merged.curationStatus = args.curationStatus;
  merged.overrideReason = args.local.overrideReason;
  merged.overrideDate = args.local.overrideDate;
  merged.lastUpdated = args.local.overrideDate;

  const interviewProcess = merged.interviewProcess ?? "";
  merged.interviewProcessHtml = interviewProcess
    ? renderInterviewProcessMarkdown(interviewProcess)
    : "";

  return merged;
}

const upstream: Company[] = (
  upstreamCompanies as unknown as Omit<
    Company,
    "source" | "overrideReason" | "overrideDate" | "interviewProcessHtml"
  >[]
).map((c) => ({
  ...c,
  source: "upstream" as const,
  lastUpdated: undefined,
  interviewProcessHtml: c.interviewProcess
    ? renderInterviewProcessMarkdown(c.interviewProcess)
    : "",
}));

const upstreamById = new Map(upstream.map((c) => [c.id, c] as const));

const local = Array.isArray(localOverrides)
  ? (localOverrides as unknown[])
  : [];

const localParsed: CompanyLocalOverride[] = local.filter((entry) => {
  if (!isCompanyLocalOverride(entry)) {
    // Keep this as a warning so dev can fix local file without breaking build.
    console.warn(
      "Ignoring invalid companies.local.json entry (expected {id, source: 'local', overrideReason, overrideDate, ...overrides}).",
      entry,
    );
    return false;
  }

  if (!isValidIsoDate(entry.overrideDate)) {
    throw new Error(
      `companies.local.json entry '${entry.id}' has invalid overrideDate (expected YYYY-MM-DD): ${entry.overrideDate}`,
    );
  }

  return true;
}) as CompanyLocalOverride[];

const mergedById: Map<string, Company> = new Map(
  upstream.map((c) => [c.id, c] as const),
);

for (const localEntry of localParsed) {
  const existing = upstreamById.get(localEntry.id);
  if (!existing) {
    requireNewCompanyFields(localEntry.id, localEntry);
  } else if (!hasEffectiveOverrideFields(localEntry, existing)) {
    // Allow keeping pre-populated or stub entries in companies.local.json without changing runtime behavior
    // until an actual field override differs from upstream.
    continue;
  }

  const curationStatus = existing ? ("edited" as const) : ("new" as const);

  const merged = mergeCompany({
    upstream: existing,
    local: localEntry,
    curationStatus,
  });

  mergedById.set(merged.id, merged);
}

const mergedCompanies: Company[] = Array.from(mergedById.values());

export const clientCompanies: ClientCompany[] = mergedCompanies.map(
  (company) => {
    const copy = { ...company } as Partial<Company>;
    delete (copy as Record<string, unknown>).interviewProcess;
    delete (copy as Record<string, unknown>).overrideReason;
    delete (copy as Record<string, unknown>).overrideDate;
    return copy as ClientCompany;
  },
);

export default mergedCompanies;
