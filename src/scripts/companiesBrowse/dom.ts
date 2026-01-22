export { MD_QUERY, isMdUp } from "../../utils/viewMode";

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
