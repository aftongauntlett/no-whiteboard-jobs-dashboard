export const MD_QUERY = "(min-width: 768px)";

export function isMdUp(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia(MD_QUERY).matches;
}

export function qs<T extends Element>(
  root: ParentNode,
  selector: string,
): T | null {
  return root.querySelector(selector) as T | null;
}

export function qsa<T extends Element>(
  root: ParentNode,
  selector: string,
): T[] {
  return Array.from(root.querySelectorAll(selector)) as T[];
}
