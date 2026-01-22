import type { CompaniesViewMode } from "../../config/pagination";
import {
  COMPANIES_PER_PAGE_OPTIONS,
  DEFAULT_COMPANIES_PER_PAGE,
} from "../../config/pagination";

export function perPageOptionsForView(view: CompaniesViewMode): number[] {
  return COMPANIES_PER_PAGE_OPTIONS[view];
}

export function defaultPerPageForView(view: CompaniesViewMode): number {
  return DEFAULT_COMPANIES_PER_PAGE[view];
}

export function nearestOption(value: number, options: number[]): number {
  if (options.length === 0) return value;
  let best = options[0]!;
  let bestDelta = Math.abs(value - best);
  for (const opt of options) {
    const delta = Math.abs(value - opt);
    if (delta < bestDelta || (delta === bestDelta && opt < best)) {
      best = opt;
      bestDelta = delta;
    }
  }
  return best;
}
