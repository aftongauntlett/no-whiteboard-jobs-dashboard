import type { EmploymentType } from "@data/types";
import { isEmploymentType } from "@data/types";

import type { InterviewTagId } from "../../config/interviewTags";
import { isInterviewTagId } from "../../config/interviewTags";

import { isMdUp } from "../../utils/viewMode";
import type { ViewMode } from "../../utils/viewMode";

import { nearestOption, perPageOptionsForView } from "./paginationConfig";
import { readInitialPageFromPath } from "./url";
import type { SortKey } from "./filters";
import { getBrowseDefaults } from "./defaults";

export function canonicalizePagePath(): void {
  const initialPathPage = readInitialPageFromPath();
  if (initialPathPage && window.location.pathname.startsWith("/page/")) {
    const next = new URL(window.location.href);
    if (!next.searchParams.get("page")) {
      next.searchParams.set("page", String(initialPathPage));
    }
    next.pathname = "/";
    window.history.replaceState({}, "", next);
  }
}

export function readInitialStateFromUrl(initialView: ViewMode): {
  query: string;
  sort: SortKey;
  selectedEmployment: Set<EmploymentType>;
  selectedInterviewTags: Set<InterviewTagId>;
  aiFriendly: boolean;
  hasInterviewDetails: boolean;
  perPage: number;
  page: number;
} {
  const params = new URL(window.location.href).searchParams;
  const d = getBrowseDefaults(initialView);

  let query = params.get("q") ?? d.query;

  let sort: SortKey = (params.get("sort") as SortKey) ?? d.sort;
  if (!(["name-asc", "name-desc", "curated-desc"] as const).includes(sort)) {
    sort = d.sort;
  }

  const selectedEmployment = new Set<EmploymentType>();
  const typesParam = params.get("employment") ?? "";
  for (const t of typesParam.split(",").map((s) => s.trim())) {
    if (isEmploymentType(t)) selectedEmployment.add(t);
  }

  const selectedInterviewTags = new Set<InterviewTagId>();
  const interviewParam = params.get("interview") ?? "";
  for (const t of interviewParam.split(",").map((s) => s.trim())) {
    if (isInterviewTagId(t)) selectedInterviewTags.add(t);
  }

  const aiFriendly = params.get("aiFriendly") === "1";
  const hasInterviewDetails = params.get("hasInterviewDetails") === "1";

  const perPageAllowed = perPageOptionsForView(initialView);
  const perPageParam = Number.parseInt(
    params.get("perPage") ?? String(d.perPage),
    10,
  );

  let perPage = perPageAllowed.includes(perPageParam)
    ? perPageParam
    : nearestOption(
        Number.isFinite(perPageParam) ? perPageParam : d.perPage,
        perPageAllowed,
      );

  if (!isMdUp()) {
    const mobileMax = 24;
    const mobileAllowed = perPageAllowed.filter((n) => n <= mobileMax);
    const mobileCap =
      mobileAllowed.length > 0 ? Math.max(...mobileAllowed) : d.perPage;
    if (perPage > mobileCap) perPage = mobileCap;
  }

  const pageParam = Number.parseInt(params.get("page") ?? String(d.page), 10);
  let page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : d.page;

  return {
    query,
    sort,
    selectedEmployment,
    selectedInterviewTags,
    aiFriendly,
    hasInterviewDetails,
    perPage,
    page,
  };
}
