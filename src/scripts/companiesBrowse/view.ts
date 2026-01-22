import { isMdUp } from "./dom";

export type ViewMode = "card" | "list";

const STORAGE_VIEW_KEY = "companies-view";

export function getView(): ViewMode {
  // Below md, always force card view (ignore stored preference).
  if (!isMdUp()) return "card";
  try {
    const value = localStorage.getItem(STORAGE_VIEW_KEY);
    return value === "list" ? "list" : "card";
  } catch {
    return "card";
  }
}
