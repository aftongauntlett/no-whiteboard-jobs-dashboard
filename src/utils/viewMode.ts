export type ViewMode = "card" | "list";

export const VIEW_MODE_STORAGE_KEY = "companies-view";

export const MD_QUERY = "(min-width: 768px)";

export function isMdUp(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia(MD_QUERY).matches;
}
