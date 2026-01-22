import type { EmploymentType } from "@data/types";
import { isEmploymentType } from "@data/types";

import { isMdUp } from "../../utils/viewMode";
import type { ViewMode } from "../../utils/viewMode";

import {
  defaultPerPageForView,
  nearestOption,
  perPageOptionsForView,
} from "./paginationConfig";
import { readInitialPageFromPath } from "./url";
import type { SortKey } from "./filters";

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
  perPage: number;
  page: number;
} {
  const params = new URL(window.location.href).searchParams;

  let query = params.get("q") ?? "";

  let sort: SortKey = (params.get("sort") as SortKey) ?? "name-asc";
  if (!(["name-asc", "name-desc", "employment"] as const).includes(sort)) {
    sort = "name-asc";
  }

  const selectedEmployment = new Set<EmploymentType>();
  const typesParam = params.get("employment") ?? "";
  for (const t of typesParam.split(",").map((s) => s.trim())) {
    if (isEmploymentType(t)) selectedEmployment.add(t);
  }

  const perPageDefault = defaultPerPageForView(initialView);
  const perPageAllowed = perPageOptionsForView(initialView);
  const perPageParam = Number.parseInt(
    params.get("perPage") ?? String(perPageDefault),
    10,
  );

  let perPage = perPageAllowed.includes(perPageParam)
    ? perPageParam
    : nearestOption(
        Number.isFinite(perPageParam) ? perPageParam : perPageDefault,
        perPageAllowed,
      );

  if (!isMdUp()) {
    const mobileMax = 24;
    const mobileAllowed = perPageAllowed.filter((n) => n <= mobileMax);
    const mobileCap =
      mobileAllowed.length > 0
        ? Math.max(...mobileAllowed)
        : defaultPerPageForView(initialView);
    if (perPage > mobileCap) perPage = mobileCap;
  }

  const pageParam = Number.parseInt(params.get("page") ?? "1", 10);
  let page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  return { query, sort, selectedEmployment, perPage, page };
}
