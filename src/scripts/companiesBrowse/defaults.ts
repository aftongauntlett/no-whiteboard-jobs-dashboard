import type { ViewMode } from "../../utils/viewMode";
import type { SortKey } from "./filters";
import { defaultPerPageForView } from "./paginationConfig";

export type BrowseDefaults = {
  query: string;
  sort: SortKey;
  aiFriendly: boolean;
  hasInterviewDetails: boolean;
  perPage: number;
  page: number;
};

export function getBrowseDefaults(view: ViewMode): BrowseDefaults {
  return {
    query: "",
    sort: "name-asc",
    aiFriendly: false,
    hasInterviewDetails: false,
    perPage: defaultPerPageForView(view),
    page: 1,
  };
}
