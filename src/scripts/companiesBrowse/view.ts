import {
  isMdUp,
  VIEW_MODE_STORAGE_KEY,
  type ViewMode,
} from "../../utils/viewMode";

export function getView(): ViewMode {
  // Below md, always force card view (ignore stored preference).
  if (!isMdUp()) return "card";
  try {
    const value = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return value === "list" ? "list" : "card";
  } catch {
    return "card";
  }
}
